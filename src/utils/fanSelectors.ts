import { matchSorter } from 'match-sorter'
import type { FanFilters, MergedFanData, SortMode } from '../types/fan'
import { inRange } from './numbers'
import { compareAirflow, compareCpuTemp, compareNoise } from './scoring'

export const buildDefaultFilters = (): FanFilters => ({
  brands: [],
  sizes: [],
  rpmRange: { min: null, max: null },
  noiseRange: { min: null, max: null },
  priceRange: { min: null, max: null },
  testPresence: 'all',
  onlyBothSources: false,
})

export const listBrands = (fans: MergedFanData[]): string[] =>
  Array.from(new Set(fans.map((fan) => fan.brand))).sort((a, b) => a.localeCompare(b))

export const listSizes = (fans: MergedFanData[]): number[] =>
  Array.from(new Set(fans.map((fan) => fan.sizeMm).filter((size): size is number => size !== null))).sort(
    (a, b) => a - b,
  )

export const applyFilters = (
  fans: MergedFanData[],
  filters: FanFilters,
  searchText: string,
): MergedFanData[] => {
  const filtered = fans.filter((fan) => {
    if (filters.brands.length > 0 && !filters.brands.includes(fan.brand)) {
      return false
    }

    if (filters.sizes.length > 0) {
      if (!fan.sizeMm || !filters.sizes.includes(fan.sizeMm)) {
        return false
      }
    }

    if (filters.rpmRange.min !== null || filters.rpmRange.max !== null) {
      if (!inRange(fan.rpm, filters.rpmRange.min, filters.rpmRange.max)) {
        return false
      }
    }

    const noise = compareNoise(fan)
    if (filters.noiseRange.min !== null || filters.noiseRange.max !== null) {
      if (!inRange(noise, filters.noiseRange.min, filters.noiseRange.max)) {
        return false
      }
    }

    if (filters.priceRange.min !== null || filters.priceRange.max !== null) {
      if (!inRange(fan.priceRub, filters.priceRange.min, filters.priceRange.max)) {
        return false
      }
    }

    if (filters.testPresence !== 'all' && fan.testPresence !== filters.testPresence) {
      return false
    }

    if (filters.onlyBothSources && fan.testPresence !== 'both') {
      return false
    }

    return true
  })

  if (!searchText.trim()) {
    return filtered
  }

  return matchSorter(filtered, searchText.trim(), {
    keys: ['modelName', 'brand', 'normalizedModel'],
    threshold: matchSorter.rankings.CONTAINS,
  })
}

const toComparable = (value: number | null, fallback = -Number.MAX_SAFE_INTEGER): number =>
  value === null ? fallback : value

export const sortFans = (fans: MergedFanData[], mode: SortMode): MergedFanData[] => {
  const sorted = [...fans]

  switch (mode) {
    case 'cpuTemp':
      return sorted.sort((a, b) => toComparable(compareCpuTemp(a), Number.MAX_SAFE_INTEGER) - toComparable(compareCpuTemp(b), Number.MAX_SAFE_INTEGER))
    case 'airflow':
      return sorted.sort((a, b) => toComparable(compareAirflow(b)) - toComparable(compareAirflow(a)))
    case 'noise':
      return sorted.sort((a, b) => toComparable(compareNoise(a), Number.MAX_SAFE_INTEGER) - toComparable(compareNoise(b), Number.MAX_SAFE_INTEGER))
    case 'balance':
      return sorted.sort((a, b) => b.scores.balancedScore - a.scores.balancedScore)
    case 'value':
      return sorted.sort((a, b) => toComparable(b.scores.valueScore) - toComparable(a.scores.valueScore))
    case 'rpm':
      return sorted.sort((a, b) => toComparable(b.rpm) - toComparable(a.rpm))
    case 'size':
      return sorted.sort((a, b) => toComparable(b.sizeMm) - toComparable(a.sizeMm))
    case 'brand':
      return sorted.sort((a, b) => a.brand.localeCompare(b.brand))
    case 'overall':
    default:
      return sorted.sort((a, b) => b.scores.performanceScore - a.scores.performanceScore)
  }
}
