const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const DEFAULT_MAX_RESULTS = 200;
const DEFAULT_PROFILE_IMAGE_SIZE = 32;
const liveInfoCache = new Map();
const channelLiveCache = new Map();

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
}

function setCors(req, res) {
    const allowedRaw = process.env.ALLOWED_ORIGINS || '*';
    const origin = req.headers.origin || '';
    if (allowedRaw.trim() === '*') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        const allowed = allowedRaw.split(',').map(x => x.trim()).filter(Boolean);
        if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
}

function normalizeString(value) {
    return String(value || '').trim();
}

function extractVideoId(input) {
    const value = normalizeString(input);
    if (!value) return '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
    const patterns = [
        /(?:youtube\.com\/watch\?[^#]*v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match) return match[1];
    }
    return '';
}

function extractChannelId(input) {
    const value = normalizeString(input);
    if (!value) return '';
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(value)) return value;
    const match = value.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    return match ? match[1] : '';
}

function getQuery(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost';
    return new URL(req.url, `${protocol}://${host}`).searchParams;
}

function clampInteger(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

async function fetchYoutube(path, params) {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
        const err = new Error('YOUTUBE_API_KEY is not configured on backend.');
        err.statusCode = 500;
        err.reason = 'missing_api_key';
        throw err;
    }
    const url = new URL(`${YOUTUBE_API_BASE}${path}`);
    for (const [paramKey, paramValue] of Object.entries(params || {})) {
        if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
            url.searchParams.set(paramKey, String(paramValue));
        }
    }
    url.searchParams.set('key', key);

    const response = await fetch(url);
    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        data = { raw: text };
    }
    if (!response.ok) {
        const err = new Error(data?.error?.message || `YouTube API error ${response.status}`);
        err.statusCode = response.status;
        err.reason = data?.error?.errors?.[0]?.reason || data?.error?.status || 'youtube_error';
        err.details = data?.error || data;
        throw err;
    }
    return data;
}

function getCached(map, key) {
    const item = map.get(key);
    if (!item || item.expiresAt <= Date.now()) {
        map.delete(key);
        return null;
    }
    return item.value;
}

function setCached(map, key, value, ttlMs) {
    map.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
}

async function findLiveVideoByChannelId(channelId) {
    const cached = getCached(channelLiveCache, channelId);
    if (cached) return cached;
    const data = await fetchYoutube('/search', {
        part: 'snippet',
        channelId,
        eventType: 'live',
        type: 'video',
        maxResults: 1
    });
    const item = data?.items?.[0];
    const videoId = item?.id?.videoId || '';
    if (!videoId) {
        const err = new Error('Активный стрим на этом канале не найден.');
        err.statusCode = 404;
        err.reason = 'live_video_not_found';
        throw err;
    }
    return setCached(channelLiveCache, channelId, {
        videoId,
        title: item?.snippet?.title || '',
        channelTitle: item?.snippet?.channelTitle || ''
    }, 15000);
}

async function getLiveInfoByVideoId(videoId) {
    const cached = getCached(liveInfoCache, videoId);
    if (cached) return cached;
    const data = await fetchYoutube('/videos', {
        part: 'snippet,liveStreamingDetails',
        id: videoId
    });
    const item = data?.items?.[0];
    if (!item) {
        const err = new Error('Видео не найдено.');
        err.statusCode = 404;
        err.reason = 'video_not_found';
        throw err;
    }
    const liveChatId = item?.liveStreamingDetails?.activeLiveChatId || '';
    if (!liveChatId) {
        const err = new Error('У этого видео нет активного liveChatId. Стрим должен идти прямо сейчас, а чат должен быть включён.');
        err.statusCode = 404;
        err.reason = 'active_live_chat_not_found';
        throw err;
    }
    return setCached(liveInfoCache, videoId, {
        videoId,
        liveChatId,
        title: item?.snippet?.title || '',
        channelTitle: item?.snippet?.channelTitle || '',
        liveBroadcastContent: item?.snippet?.liveBroadcastContent || ''
    }, 30000);
}

function normalizeCommandName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/^!+/, '')
        .replace(/^\/+/, '')
        .trim();
}

function parseCommand(message) {
    const text = normalizeString(message.text);
    if (!/^[!\/]/.test(text)) return null;
    const withoutPrefix = text.replace(/^[!\/]+/, '').trim();
    const [rawName, ...rest] = withoutPrefix.split(/\s+/);
    const name = normalizeCommandName(rawName);
    const args = rest.join(' ').trim();
    const aliases = {
        'колода': 'generate_deck',
        'deck': 'generate_deck',
        'дек': 'generate_deck',
        'рандом': 'generate_deck',
        'хаос': 'chaos_deck',
        'chaos': 'chaos_deck',
        'замена': 'replace_random',
        'replace': 'replace_random',
        'реролл': 'replace_random',
        'reroll': 'replace_random',
        'карта': 'pick_card',
        'card': 'pick_card',
        'бан': 'ban_card',
        'ban': 'ban_card',
        'голос': 'vote',
        'vote': 'vote',
        'наказание': 'punishment',
        'punish': 'punishment'
    };
    const action = aliases[name] || '';
    if (!action) return null;
    return {
        id: message.id,
        action,
        name,
        args,
        raw: text,
        author: message.author
    };
}

function mapMessage(item) {
    const snippet = item?.snippet || {};
    const authorDetails = item?.authorDetails || {};
    const message = {
        id: item?.id || '',
        type: snippet.type || '',
        publishedAt: snippet.publishedAt || '',
        text: snippet.displayMessage || snippet.textMessageDetails?.messageText || '',
        author: {
            name: authorDetails.displayName || '',
            channelId: authorDetails.channelId || '',
            profileImageUrl: authorDetails.profileImageUrl || '',
            isOwner: Boolean(authorDetails.isChatOwner),
            isModerator: Boolean(authorDetails.isChatModerator),
            isSponsor: Boolean(authorDetails.isChatSponsor),
            isVerified: Boolean(authorDetails.isVerified)
        }
    };
    if (snippet.superChatDetails) {
        message.superChat = {
            amountMicros: snippet.superChatDetails.amountMicros,
            currency: snippet.superChatDetails.currency,
            displayString: snippet.superChatDetails.amountDisplayString || ''
        };
    }
    return message;
}

async function resolveLiveInfo(query) {
    const directLiveChatId = normalizeString(query.get('liveChatId'));
    if (directLiveChatId) {
        return {
            videoId: '',
            liveChatId: directLiveChatId,
            title: '',
            channelTitle: '',
            liveBroadcastContent: ''
        };
    }

    const source = normalizeString(query.get('source') || query.get('url') || query.get('videoUrl'));
    let videoId = normalizeString(query.get('videoId')) || extractVideoId(source);
    let channelId = normalizeString(query.get('channelId')) || extractChannelId(source);

    if (!videoId && !channelId && source && !/^https?:\/\//i.test(source) && source.length > 11) {
        return {
            videoId: '',
            liveChatId: source,
            title: '',
            channelTitle: '',
            liveBroadcastContent: ''
        };
    }

    if (!videoId && channelId) {
        const liveVideo = await findLiveVideoByChannelId(channelId);
        videoId = liveVideo.videoId;
    }
    if (!videoId) {
        const err = new Error('Укажи ссылку на live-видео YouTube, videoId, channelId или liveChatId.');
        err.statusCode = 400;
        err.reason = 'missing_source';
        throw err;
    }
    return getLiveInfoByVideoId(videoId);
}

async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    if (req.method !== 'GET') {
        sendJson(res, 405, { ok: false, error: 'Method not allowed' });
        return;
    }

    const query = getQuery(req);
    if (query.get('health') === '1') {
        sendJson(res, 200, {
            ok: true,
            service: 'youtube-chat',
            hasApiKey: Boolean(process.env.YOUTUBE_API_KEY)
        });
        return;
    }

    try {
        const liveInfo = await resolveLiveInfo(query);
        const maxResults = clampInteger(query.get('maxResults'), 200, 2000, DEFAULT_MAX_RESULTS);
        const profileImageSize = clampInteger(query.get('profileImageSize'), 16, 720, DEFAULT_PROFILE_IMAGE_SIZE);
        const data = await fetchYoutube('/liveChat/messages', {
            liveChatId: liveInfo.liveChatId,
            part: 'snippet,authorDetails',
            pageToken: query.get('pageToken') || '',
            maxResults,
            profileImageSize,
            hl: query.get('hl') || 'ru'
        });
        const messages = (data?.items || []).map(mapMessage);
        const commands = messages.map(parseCommand).filter(Boolean);
        sendJson(res, 200, {
            ok: true,
            live: liveInfo,
            nextPageToken: data?.nextPageToken || '',
            pollingIntervalMillis: data?.pollingIntervalMillis || 5000,
            offlineAt: data?.offlineAt || '',
            messages,
            commands
        });
    } catch (err) {
        sendJson(res, err.statusCode || 500, {
            ok: false,
            error: err.message || 'Unknown error',
            reason: err.reason || 'internal_error'
        });
    }
}

module.exports = handler;

if (require.main === module) {
    const http = require('http');
    const port = Number(process.env.PORT || 8787);
    const server = http.createServer((req, res) => handler(req, res));
    server.listen(port, () => {
        console.log(`YouTube chat backend listening on http://127.0.0.1:${port}/api/youtube-chat`);
    });
}
