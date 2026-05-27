import type {
  AnemometerTest,
  CpuTest,
  MergeDiagnostics,
  MergedFanData,
  RankingSnapshot,
} from '../types/fan'
import { applyScoring } from '../utils/scoring'
import { extractBrand, fanFingerprint, normalizeFanName, similarityScore } from '../utils/strings'

const EMPTY_SCORES = {
  performanceScore: 0,
  silenceScore: 0,
  airflowScore: 0,
  cpuCoolingScore: 0,
  balancedScore: 0,
  valueScore: null,
  efficiencyPerNoise: null,
  airflowPerNoise: null,
}

const EMPTY_INSIGHT = {
  bestChoice: false,
  bestSilent: false,
  bestAirflow: false,
  goodBalance: false,
  controversial: false,
  weak: false,
  verdict: '',
  strengths: [] as string[],
  weaknesses: [] as string[],
}

const preferValue = (first: number | null, second: number | null): number | null => {
  if (first !== null) {
    return first
  }

  return second
}

const composeMergedItem = (cpu: CpuTest | null, anemo: AnemometerTest | null): MergedFanData => {
  const modelName = cpu?.modelName ?? anemo?.modelName ?? 'Unknown model'
  const normalizedModel = normalizeFanName(modelName)

  return {
    id: normalizedModel || modelName.toLowerCase(),
    modelName,
    normalizedModel,
    brand: extractBrand(modelName),
    sizeMm: preferValue(cpu?.sizeMm ?? null, anemo?.sizeMm ?? null),
    rpm: preferValue(cpu?.rpm ?? null, anemo?.rpm ?? null),
    priceRub: preferValue(cpu?.priceRub ?? null, anemo?.priceRub ?? null),
    testPresence: cpu && anemo ? 'both' : cpu ? 'cpu' : 'anemometer',
    cpu,
    anemometer: anemo,
    scores: EMPTY_SCORES,
    insight: EMPTY_INSIGHT,
  }
}

const findBestFuzzyMatch = (
  cpuItem: CpuTest,
  candidates: AnemometerTest[],
): { candidate: AnemometerTest; score: number } | null => {
  let best: { candidate: AnemometerTest; score: number } | null = null

  for (const candidate of candidates) {
    const score = similarityScore(cpuItem.normalizedModel, candidate.normalizedModel)

    if (!best || score > best.score) {
      best = { candidate, score }
    }
  }

  return best
}

export const mergeFanTests = (
  cpuTests: CpuTest[],
  anemometerTests: AnemometerTest[],
): { fans: MergedFanData[]; diagnostics: MergeDiagnostics; rankings: RankingSnapshot } => {
  const merged: MergedFanData[] = []
  const unmatchedCpu: string[] = []
  const unmatchedAnemometer: string[] = []
  const possibleMatches: MergeDiagnostics['possibleMatches'] = []

  const anemoByNormalized = new Map<string, AnemometerTest[]>()
  const anemoByFingerprint = new Map<string, AnemometerTest[]>()

  for (const anemoItem of anemometerTests) {
    const byNorm = anemoByNormalized.get(anemoItem.normalizedModel) ?? []
    byNorm.push(anemoItem)
    anemoByNormalized.set(anemoItem.normalizedModel, byNorm)

    const fp = fanFingerprint(anemoItem.normalizedModel)
    const byFp = anemoByFingerprint.get(fp) ?? []
    byFp.push(anemoItem)
    anemoByFingerprint.set(fp, byFp)
  }

  const usedAnemo = new Set<AnemometerTest>()

  for (const cpuItem of cpuTests) {
    let matchedAnemo: AnemometerTest | null = null

    const exact = (anemoByNormalized.get(cpuItem.normalizedModel) ?? []).find(
      (candidate) => !usedAnemo.has(candidate),
    )

    if (exact) {
      matchedAnemo = exact
    }

    if (!matchedAnemo) {
      const fp = fanFingerprint(cpuItem.normalizedModel)
      const fingerprintMatch = (anemoByFingerprint.get(fp) ?? []).find(
        (candidate) => !usedAnemo.has(candidate),
      )

      if (fingerprintMatch) {
        matchedAnemo = fingerprintMatch
      }
    }

    if (!matchedAnemo) {
      const freeCandidates = anemometerTests.filter((candidate) => !usedAnemo.has(candidate))
      const fuzzyMatch = findBestFuzzyMatch(cpuItem, freeCandidates)

      if (fuzzyMatch && fuzzyMatch.score >= 0.93) {
        matchedAnemo = fuzzyMatch.candidate
      } else if (fuzzyMatch && fuzzyMatch.score >= 0.78) {
        possibleMatches.push({
          cpuModel: cpuItem.modelName,
          anemometerModel: fuzzyMatch.candidate.modelName,
          score: Number(fuzzyMatch.score.toFixed(3)),
        })
      }
    }

    if (matchedAnemo) {
      usedAnemo.add(matchedAnemo)
      merged.push(composeMergedItem(cpuItem, matchedAnemo))
    } else {
      unmatchedCpu.push(cpuItem.modelName)
      merged.push(composeMergedItem(cpuItem, null))
    }
  }

  for (const anemoItem of anemometerTests) {
    if (!usedAnemo.has(anemoItem)) {
      unmatchedAnemometer.push(anemoItem.modelName)
      merged.push(composeMergedItem(null, anemoItem))
    }
  }

  const deduped = Array.from(new Map(merged.map((item) => [item.id, item])).values())

  const { fans, rankings } = applyScoring(deduped)

  return {
    fans,
    rankings,
    diagnostics: {
      unmatchedCpu,
      unmatchedAnemometer,
      possibleMatches,
    },
  }
}
