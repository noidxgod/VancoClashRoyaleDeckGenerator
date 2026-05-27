import type { MergedFanData, RankingSnapshot } from '../types/fan'
import { clamp, round, safeDivide } from './numbers'

interface RawMetrics {
  cpuTemp: number | null
  airflow: number | null
  noise: number | null
}

const average = (values: Array<number | null>): number | null => {
  const filtered = values.filter((value): value is number => value !== null)
  if (!filtered.length) {
    return null
  }

  const sum = filtered.reduce((acc, value) => acc + value, 0)
  return sum / filtered.length
}

const normalizeHigherBetter = (value: number | null, domain: number[]): number => {
  if (value === null || domain.length === 0) {
    return 0
  }

  const min = Math.min(...domain)
  const max = Math.max(...domain)

  if (max === min) {
    return 50
  }

  return clamp(((value - min) / (max - min)) * 100)
}

const normalizeLowerBetter = (value: number | null, domain: number[]): number => {
  if (value === null || domain.length === 0) {
    return 0
  }

  const min = Math.min(...domain)
  const max = Math.max(...domain)

  if (max === min) {
    return 50
  }

  return clamp(((max - value) / (max - min)) * 100)
}

const fanRawMetrics = (fan: MergedFanData): RawMetrics => {
  const cpuTemp = average([fan.cpu?.cpuTempAt46Db ?? null, fan.cpu?.cpuTempMaxRpm ?? null])

  const airflow = average([
    fan.anemometer?.airflowMax ?? null,
    fan.anemometer?.airflowAt43Db ?? null,
    fan.anemometer?.airflowAt1500Rpm ?? null,
  ])

  const noise = average([
    fan.cpu?.noiseMaxDb ?? null,
    fan.anemometer?.noiseMaxDb ?? null,
    fan.anemometer?.noiseAt1500Rpm ?? null,
  ])

  return { cpuTemp, airflow, noise }
}

const pickTopBy = (
  fans: MergedFanData[],
  selector: (fan: MergedFanData) => number | null,
): string | null => {
  const sorted = fans
    .map((fan) => ({ fan, score: selector(fan) }))
    .filter((entry): entry is { fan: MergedFanData; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score)

  return sorted[0]?.fan.modelName ?? null
}

const pickTopByLowest = (
  fans: MergedFanData[],
  selector: (fan: MergedFanData) => number | null,
): string | null => {
  const sorted = fans
    .map((fan) => ({ fan, score: selector(fan) }))
    .filter((entry): entry is { fan: MergedFanData; score: number } => entry.score !== null)
    .sort((a, b) => a.score - b.score)

  return sorted[0]?.fan.modelName ?? null
}

export const applyScoring = (fans: MergedFanData[]): { fans: MergedFanData[]; rankings: RankingSnapshot } => {
  const rawByModel = new Map<string, RawMetrics>()
  const cpuTempDomain: number[] = []
  const airflowDomain: number[] = []
  const noiseDomain: number[] = []

  for (const fan of fans) {
    const raw = fanRawMetrics(fan)
    rawByModel.set(fan.id, raw)

    if (raw.cpuTemp !== null) {
      cpuTempDomain.push(raw.cpuTemp)
    }
    if (raw.airflow !== null) {
      airflowDomain.push(raw.airflow)
    }
    if (raw.noise !== null) {
      noiseDomain.push(raw.noise)
    }
  }

  const valueProxyDomain: number[] = []
  const interimScores = fans.map((fan) => {
    const raw = rawByModel.get(fan.id) ?? { cpuTemp: null, airflow: null, noise: null }

    const cpuCoolingScore = normalizeLowerBetter(raw.cpuTemp, cpuTempDomain)
    const airflowScore = normalizeHigherBetter(raw.airflow, airflowDomain)
    const silenceScore = normalizeLowerBetter(raw.noise, noiseDomain)

    const performanceScore = clamp(cpuCoolingScore * 0.45 + airflowScore * 0.35 + silenceScore * 0.2)
    const balancedScore = clamp(cpuCoolingScore * 0.4 + airflowScore * 0.3 + silenceScore * 0.3)

    const efficiencyPerNoise = safeDivide(performanceScore, raw.noise)
    const airflowPerNoise = safeDivide(raw.airflow, raw.noise)

    const valueProxy = safeDivide(performanceScore, fan.priceRub)
    if (valueProxy !== null) {
      valueProxyDomain.push(valueProxy)
    }

    return {
      fan,
      raw,
      cpuCoolingScore,
      airflowScore,
      silenceScore,
      performanceScore,
      balancedScore,
      efficiencyPerNoise,
      airflowPerNoise,
      valueProxy,
    }
  })

  const scoredFans: MergedFanData[] = interimScores.map((entry) => {
    const valueScore = normalizeHigherBetter(entry.valueProxy, valueProxyDomain)

    const strengths: string[] = []
    const weaknesses: string[] = []

    if (entry.cpuCoolingScore >= 75) {
      strengths.push('Сильное охлаждение CPU')
    }
    if (entry.airflowScore >= 75) {
      strengths.push('Высокий airflow')
    }
    if (entry.silenceScore >= 75) {
      strengths.push('Низкий уровень шума')
    }
    if (entry.balancedScore >= 70) {
      strengths.push('Хороший общий баланс')
    }

    if (entry.cpuCoolingScore < 40) {
      weaknesses.push('Слабое охлаждение CPU')
    }
    if (entry.airflowScore < 40) {
      weaknesses.push('Невысокий airflow')
    }
    if (entry.silenceScore < 40) {
      weaknesses.push('Повышенный шум')
    }
    if (entry.fan.testPresence !== 'both') {
      weaknesses.push('Неполный набор тестов')
    }

    const controversial =
      (entry.cpuCoolingScore >= 72 && entry.silenceScore <= 35) ||
      (entry.airflowScore >= 72 && entry.silenceScore <= 35)

    const weak = entry.performanceScore <= 35
    const goodBalance = entry.balancedScore >= 68

    const verdict = weak
      ? 'Слабый результат: лучше рассмотреть альтернативы.'
      : controversial
        ? 'Спорный результат: быстрый, но шумный вариант.'
        : entry.silenceScore >= 78
          ? 'Лучше для тихой сборки.'
          : entry.cpuCoolingScore >= 78
            ? 'Лучше для максимального охлаждения.'
            : entry.valueProxy !== null && valueScore >= 70
              ? 'Хороший бюджетный выбор.'
              : goodBalance
                ? 'Хороший баланс характеристик.'
                : 'Надежный вариант для универсальной сборки.'

    return {
      ...entry.fan,
      scores: {
        performanceScore: round(entry.performanceScore, 1) ?? 0,
        silenceScore: round(entry.silenceScore, 1) ?? 0,
        airflowScore: round(entry.airflowScore, 1) ?? 0,
        cpuCoolingScore: round(entry.cpuCoolingScore, 1) ?? 0,
        balancedScore: round(entry.balancedScore, 1) ?? 0,
        valueScore: entry.valueProxy === null ? null : round(valueScore, 1),
        efficiencyPerNoise: round(entry.efficiencyPerNoise, 3),
        airflowPerNoise: round(entry.airflowPerNoise, 3),
      },
      insight: {
        bestChoice: false,
        bestSilent: false,
        bestAirflow: false,
        goodBalance,
        controversial,
        weak,
        verdict,
        strengths,
        weaknesses,
      },
    }
  })

  const rankings: RankingSnapshot = {
    overall: pickTopBy(scoredFans, (fan) => fan.scores.performanceScore),
    silent: pickTopBy(scoredFans, (fan) => fan.scores.silenceScore),
    cpuCooling: pickTopBy(scoredFans, (fan) => fan.scores.cpuCoolingScore),
    airflow: pickTopBy(scoredFans, (fan) => fan.scores.airflowScore),
    balanced: pickTopBy(scoredFans, (fan) => fan.scores.balancedScore),
    value: pickTopBy(scoredFans, (fan) => fan.scores.valueScore),
  }

  const updatedFans = scoredFans.map((fan) => {
    const bestChoice = fan.modelName === rankings.overall
    const bestSilent = fan.modelName === rankings.silent
    const bestAirflow = fan.modelName === rankings.airflow

    const extraWeaknesses = [...fan.insight.weaknesses]
    if (
      fan.cpu &&
      fan.anemometer &&
      fan.scores.cpuCoolingScore >= 70 &&
      fan.scores.airflowScore <= 35
    ) {
      extraWeaknesses.push('В CPU тесте хорош, но airflow заметно ниже конкурентов')
    }

    return {
      ...fan,
      insight: {
        ...fan.insight,
        bestChoice,
        bestSilent,
        bestAirflow,
        weaknesses: [...new Set(extraWeaknesses)],
      },
    }
  })

  return { fans: updatedFans, rankings }
}

export const compareCpuTemp = (fan: MergedFanData): number | null => {
  const cpuTemp = fan.cpu?.cpuTempAt46Db ?? fan.cpu?.cpuTempMaxRpm ?? null
  return cpuTemp
}

export const compareNoise = (fan: MergedFanData): number | null =>
  fan.anemometer?.noiseAt1500Rpm ?? fan.cpu?.noiseMaxDb ?? fan.anemometer?.noiseMaxDb ?? null

export const compareAirflow = (fan: MergedFanData): number | null =>
  fan.anemometer?.airflowMax ?? fan.anemometer?.airflowAt43Db ?? fan.anemometer?.airflowAt1500Rpm ?? null

export const comparePrice = (fan: MergedFanData): number | null => fan.priceRub

export const findQuietWinner = (fans: MergedFanData[]): string | null =>
  pickTopByLowest(fans, (fan) => compareNoise(fan))
