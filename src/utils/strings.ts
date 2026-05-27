import { MODEL_NORMALIZATION_STOP_WORDS, SIZE_REGEX } from '../data/constants'

const MULTI_WORD_BRANDS = ['be quiet', 'id-cooling', 'lian li']

export const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

export const normalizeFanName = (value: string): string => {
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
    .filter((token) => !MODEL_NORMALIZATION_STOP_WORDS.includes(token))

  return tokens.join(' ')
}

export const fanFingerprint = (value: string): string => {
  const tokens = normalizeFanName(value)
    .split(' ')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  return tokens.join(' ')
}

export const extractBrand = (model: string): string => {
  const normalized = normalizeFanName(model)
  for (const brand of MULTI_WORD_BRANDS) {
    if (normalized.startsWith(brand)) {
      return brand
    }
  }

  const [firstToken] = normalized.split(' ')
  return firstToken ?? 'unknown'
}

export const detectSizeFromModel = (model: string): number | null => {
  const match = model.match(SIZE_REGEX)
  if (!match?.[1]) {
    return null
  }

  const size = Number(match[1])
  return Number.isFinite(size) ? size : null
}

export const slugifyModel = (value: string): string => {
  const cleaned = normalizeFanName(value)
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
  return cleaned || 'fan-model'
}

export const titleize = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')

export const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) {
    return 0
  }

  if (a.length === 0) {
    return b.length
  }

  if (b.length === 0) {
    return a.length
  }

  const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
    Array.from({ length: a.length + 1 }, () => 0),
  )

  for (let i = 0; i <= b.length; i += 1) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[b.length][a.length]
}

export const similarityScore = (a: string, b: string): number => {
  const first = normalizeFanName(a)
  const second = normalizeFanName(b)

  if (!first || !second) {
    return 0
  }

  if (first === second || fanFingerprint(first) === fanFingerprint(second)) {
    return 1
  }

  const distance = levenshteinDistance(first, second)
  const length = Math.max(first.length, second.length)
  if (!length) {
    return 0
  }

  return 1 - distance / length
}
