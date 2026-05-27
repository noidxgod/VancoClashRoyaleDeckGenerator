import { DEFAULT_DATA_SOURCE_CONFIG } from './constants'
import { loadCsvFromSource } from './csv'
import { demoAnemometerTests, demoCpuTests } from './demoData'
import { mergeFanTests } from './merge'
import { normalizeAnemometerRows, normalizeCpuRows } from './normalizers'
import type { DataSourceConfig, FanDataset } from '../types/fan'

interface LoadedRows {
  rows: Record<string, string>[]
  sourceLabel: string
  usedPublic: boolean
}

const attemptLoad = async (
  label: 'CPU' | 'Anemometer',
  localPath: string,
  publicUrl: string,
  preferPublic: boolean,
  warnings: string[],
): Promise<LoadedRows | null> => {
  const ordered = preferPublic
    ? [
        { source: publicUrl, usedPublic: true },
        { source: localPath, usedPublic: false },
      ]
    : [
        { source: localPath, usedPublic: false },
        { source: publicUrl, usedPublic: true },
      ]

  for (const option of ordered) {
    try {
      const rows = await loadCsvFromSource(option.source)
      if (rows.length === 0) {
        warnings.push(`${label}: источник ${option.source} вернул пустой CSV`)
        continue
      }

      return {
        rows,
        sourceLabel: option.source,
        usedPublic: option.usedPublic,
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error'
      warnings.push(`${label}: не удалось загрузить ${option.source}. ${reason}`)
    }
  }

  return null
}

export const loadFanDataset = async (
  config: DataSourceConfig = DEFAULT_DATA_SOURCE_CONFIG,
): Promise<FanDataset> => {
  const warnings: string[] = []

  const cpuLoaded = await attemptLoad(
    'CPU',
    config.cpuCsvPath,
    config.cpuCsvUrl,
    config.preferPublicUrls,
    warnings,
  )

  const anemoLoaded = await attemptLoad(
    'Anemometer',
    config.anemometerCsvPath,
    config.anemometerCsvUrl,
    config.preferPublicUrls,
    warnings,
  )

  const cpuTests = cpuLoaded ? normalizeCpuRows(cpuLoaded.rows) : demoCpuTests
  const anemoTests = anemoLoaded ? normalizeAnemometerRows(anemoLoaded.rows) : demoAnemometerTests

  const usedDemoData = !cpuLoaded || !anemoLoaded

  if (!cpuLoaded) {
    warnings.push('CPU: используется demo dataset (не удалось загрузить CSV).')
  }
  if (!anemoLoaded) {
    warnings.push('Anemometer: используется demo dataset (не удалось загрузить CSV).')
  }

  const { fans, diagnostics, rankings } = mergeFanTests(cpuTests, anemoTests)

  const sourceMode =
    !cpuLoaded && !anemoLoaded
      ? 'demo'
      : cpuLoaded && anemoLoaded
        ? cpuLoaded.usedPublic === anemoLoaded.usedPublic
          ? cpuLoaded.usedPublic
            ? 'public-url'
            : 'local-csv'
          : 'mixed'
        : 'mixed'

  return {
    fans,
    diagnostics,
    rankings,
    meta: {
      usedDemoData,
      sourceMode,
      cpuSource: cpuLoaded?.sourceLabel ?? 'demoCpuTests',
      anemometerSource: anemoLoaded?.sourceLabel ?? 'demoAnemometerTests',
      loadedAt: new Date().toISOString(),
      warnings,
    },
  }
}
