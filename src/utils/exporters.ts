import Papa from 'papaparse'
import type { MergedFanData } from '../types/fan'

const toExportRows = (fans: MergedFanData[]): Record<string, string | number | null>[] =>
  fans.map((fan) => ({
    modelName: fan.modelName,
    brand: fan.brand,
    sizeMm: fan.sizeMm,
    rpm: fan.rpm,
    priceRub: fan.priceRub,
    testPresence: fan.testPresence,
    cpuTempAt46Db: fan.cpu?.cpuTempAt46Db ?? null,
    cpuTempMaxRpm: fan.cpu?.cpuTempMaxRpm ?? null,
    cpuNoiseMaxDb: fan.cpu?.noiseMaxDb ?? null,
    airflowMax: fan.anemometer?.airflowMax ?? null,
    airflowAt43Db: fan.anemometer?.airflowAt43Db ?? null,
    airflowAt1500Rpm: fan.anemometer?.airflowAt1500Rpm ?? null,
    anemoNoiseAt1500Rpm: fan.anemometer?.noiseAt1500Rpm ?? null,
    performanceScore: fan.scores.performanceScore,
    silenceScore: fan.scores.silenceScore,
    airflowScore: fan.scores.airflowScore,
    cpuCoolingScore: fan.scores.cpuCoolingScore,
    balancedScore: fan.scores.balancedScore,
    valueScore: fan.scores.valueScore,
    efficiencyPerNoise: fan.scores.efficiencyPerNoise,
    airflowPerNoise: fan.scores.airflowPerNoise,
    verdict: fan.insight.verdict,
  }))

const triggerDownload = (content: string, mimeType: string, fileName: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

export const exportFansAsJson = (fans: MergedFanData[]): void => {
  const content = JSON.stringify(toExportRows(fans), null, 2)
  triggerDownload(content, 'application/json;charset=utf-8', 'merged-fans.json')
}

export const exportFansAsCsv = (fans: MergedFanData[]): void => {
  const content = Papa.unparse(toExportRows(fans))
  triggerDownload(content, 'text/csv;charset=utf-8', 'merged-fans.csv')
}
