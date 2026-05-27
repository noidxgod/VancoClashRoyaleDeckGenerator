import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const cpuPath = path.join(root, 'public/data/cpu-tests.csv')
const anPath = path.join(root, 'public/data/anemometer-tests.csv')
const outDir = path.join(root, 'public/fans')
fs.mkdirSync(outDir, { recursive: true })

const stopWords = new Set(['mm', 'об', 'rpm', 'fan', 'hight', 'high', 'speed', 'edition', 'extreme'])

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim()

const normalizeFanName = (value) => {
  const compact = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/，/g, ',')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[\\/]/g, ' ')
    .replace(/[+]/g, ' plus ')
    .replace(/[^a-zа-я0-9\-\s]/gi, ' ')

  const tokens = compact
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !stopWords.has(token))

  return tokens.join(' ')
}

const slugifyModel = (value) => {
  const cleaned = normalizeFanName(value)
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
  return cleaned || 'fan-model'
}

const extractFirstColumnModels = (csvText) => {
  const lines = csvText.split(/\r?\n/).filter(Boolean)
  if (lines.length <= 1) {
    return []
  }

  const models = []
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]
    const commaIndex = line.indexOf(',')
    const firstCell = commaIndex === -1 ? line : line.slice(0, commaIndex)
    const model = firstCell.replace(/^"|"$/g, '').trim()
    if (model) {
      models.push(model)
    }
  }

  return models
}

const hashString = (value) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const extractBrand = (model) => {
  const normalized = normalizeFanName(model)
  const multiWordBrands = ['be quiet', 'id-cooling', 'lian li']

  for (const brand of multiWordBrands) {
    if (normalized.startsWith(brand)) {
      return brand
    }
  }

  const [firstToken] = normalized.split(' ')
  return firstToken || 'unknown'
}

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const buildSvg = ({ model, slug }) => {
  const hash = hashString(`${slug}|${model}`)
  const hueA = hash % 360
  const hueB = (hueA + 55 + (hash % 90)) % 360
  const hueC = (hueA + 200) % 360
  const brand = extractBrand(model).toUpperCase()

  const modelEsc = escapeXml(model)
  const brandEsc = escapeXml(brand)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hueA} 82% 16%)"/>
      <stop offset="100%" stop-color="hsl(${hueB} 86% 11%)"/>
    </linearGradient>
    <radialGradient id="core" cx="50%" cy="50%" r="58%">
      <stop offset="0%" stop-color="hsl(${hueC} 90% 66%)" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="hsl(${hueA} 95% 44%)" stop-opacity="0.18"/>
    </radialGradient>
    <linearGradient id="blade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hueC} 92% 72%)" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="hsl(${hueA} 78% 40%)" stop-opacity="0.42"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1024" height="1024" rx="46" fill="url(#bg)"/>
  <circle cx="512" cy="450" r="332" fill="none" stroke="hsl(${hueC} 88% 72%)" stroke-opacity="0.35" stroke-width="18"/>
  <circle cx="512" cy="450" r="290" fill="url(#core)"/>

  <g transform="translate(512 450)">
    <g fill="url(#blade)" stroke="hsl(${hueC} 95% 78%)" stroke-opacity="0.65" stroke-width="3">
      <path d="M 0 0 C 70 -126 208 -177 246 -92 C 184 -37 95 24 18 32 Z"/>
      <path transform="rotate(60)" d="M 0 0 C 70 -126 208 -177 246 -92 C 184 -37 95 24 18 32 Z"/>
      <path transform="rotate(120)" d="M 0 0 C 70 -126 208 -177 246 -92 C 184 -37 95 24 18 32 Z"/>
      <path transform="rotate(180)" d="M 0 0 C 70 -126 208 -177 246 -92 C 184 -37 95 24 18 32 Z"/>
      <path transform="rotate(240)" d="M 0 0 C 70 -126 208 -177 246 -92 C 184 -37 95 24 18 32 Z"/>
      <path transform="rotate(300)" d="M 0 0 C 70 -126 208 -177 246 -92 C 184 -37 95 24 18 32 Z"/>
    </g>
    <circle cx="0" cy="0" r="62" fill="hsl(${hueB} 80% 10%)" stroke="hsl(${hueC} 92% 72%)" stroke-width="8"/>
    <circle cx="0" cy="0" r="15" fill="hsl(${hueC} 95% 80%)"/>
  </g>

  <rect x="84" y="760" width="856" height="180" rx="24" fill="rgba(2,6,23,0.66)" stroke="rgba(148,163,184,0.28)" stroke-width="2"/>
  <text x="112" y="814" fill="#93c5fd" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="1.5">${brandEsc}</text>
  <foreignObject x="112" y="828" width="800" height="102">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;font-size:34px;font-weight:700;line-height:1.22;">
      ${modelEsc}
    </div>
  </foreignObject>
</svg>`
}

const cpuCsv = fs.readFileSync(cpuPath, 'utf8')
const anCsv = fs.readFileSync(anPath, 'utf8')

const models = [
  ...extractFirstColumnModels(cpuCsv),
  ...extractFirstColumnModels(anCsv),
]

const slugToModel = new Map()
for (const model of models) {
  const slug = slugifyModel(model)
  if (!slugToModel.has(slug)) {
    slugToModel.set(slug, model)
  }
}

for (const [slug, model] of slugToModel.entries()) {
  const svgPath = path.join(outDir, `${slug}.svg`)
  const pngPath = path.join(outDir, `${slug}.png`)
  fs.writeFileSync(svgPath, buildSvg({ model, slug }), 'utf8')
  execFileSync('magick', [svgPath, pngPath], { stdio: 'ignore' })
  fs.unlinkSync(svgPath)
}

console.log(`Generated ${slugToModel.size} fan images in public/fans`) 
