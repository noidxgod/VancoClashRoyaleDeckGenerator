import { clsx } from 'clsx'

export const cn = (...values: Array<string | false | null | undefined>): string => clsx(values)

export const scoreBand = (score: number | null): 'good' | 'mid' | 'bad' | 'na' => {
  if (score === null || Number.isNaN(score)) {
    return 'na'
  }

  if (score >= 75) {
    return 'good'
  }

  if (score >= 45) {
    return 'mid'
  }

  return 'bad'
}

export const scoreBandClass = (score: number | null): string => {
  const band = scoreBand(score)
  switch (band) {
    case 'good':
      return 'text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-500/40'
    case 'mid':
      return 'text-amber-300 bg-amber-500/15 ring-1 ring-amber-500/40'
    case 'bad':
      return 'text-rose-300 bg-rose-500/15 ring-1 ring-rose-500/40'
    default:
      return 'text-slate-300 bg-slate-600/20 ring-1 ring-slate-500/40'
  }
}
