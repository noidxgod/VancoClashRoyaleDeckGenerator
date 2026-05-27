export const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[−–—]/g, '-')
    .replace(/[^0-9.-]/g, '')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const clamp = (value: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, value))

export const safeDivide = (numerator: number | null, denominator: number | null): number | null => {
  if (numerator === null || denominator === null || denominator === 0) {
    return null
  }

  return numerator / denominator
}

export const round = (value: number | null, fractionDigits = 1): number | null => {
  if (value === null || !Number.isFinite(value)) {
    return null
  }

  return Number(value.toFixed(fractionDigits))
}

export const formatNumber = (
  value: number | null,
  options: { suffix?: string; fractionDigits?: number; fallback?: string } = {},
): string => {
  const { suffix = '', fractionDigits = 1, fallback = '—' } = options
  if (value === null || Number.isNaN(value)) {
    return fallback
  }

  return `${value.toFixed(fractionDigits)}${suffix}`
}

export const inRange = (value: number | null, min: number | null, max: number | null): boolean => {
  if (value === null) {
    return false
  }

  if (min !== null && value < min) {
    return false
  }

  if (max !== null && value > max) {
    return false
  }

  return true
}
