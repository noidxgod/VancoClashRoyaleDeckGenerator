import type { AnemometerTest, CpuTest } from '../types/fan'
import { parseNumber } from '../utils/numbers'
import { detectSizeFromModel, normalizeFanName, normalizeWhitespace } from '../utils/strings'
import type { CsvRow } from './csv'

const normalizeHeader = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/gi, '')

const buildHeaderLookup = (row: CsvRow): Map<string, string> => {
  const lookup = new Map<string, string>()
  for (const key of Object.keys(row)) {
    lookup.set(normalizeHeader(key), key)
  }
  return lookup
}

const pickCell = (row: CsvRow, aliases: string[]): string => {
  const lookup = buildHeaderLookup(row)

  for (const alias of aliases) {
    const key = lookup.get(normalizeHeader(alias))
    if (key) {
      const value = row[key]
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim()
      }
    }
  }

  return ''
}

const parseRpm = (direct: string, model: string): number | null => {
  const parsed = parseNumber(direct)
  if (parsed !== null) {
    return parsed
  }

  const match = model.match(/(\d{3,4})\s?(об|rpm)/i)
  if (!match?.[1]) {
    return null
  }

  const rpm = Number(match[1])
  return Number.isFinite(rpm) ? rpm : null
}

const parseSize = (direct: string, model: string): number | null => {
  const explicit = parseNumber(direct)
  if (explicit !== null) {
    return explicit
  }

  return detectSizeFromModel(model)
}

const parseStaticPressure = (value: string): number | null => parseNumber(value)

const COMMON_ALIASES = {
  model: ['модель вентилятора', 'модель', 'fan model', 'model', 'название'],
  rpm: ['rpm', 'обороты', 'max rpm', 'обороты'],
  size: ['размер', 'размер мм', 'size', 'size mm'],
  price: ['цена', 'price', 'цена руб', 'цена~руб', 'ценаруб', 'цена~（руб）'],
  staticPressure: [
    'статическое давление',
    'static pressure',
    'pressure',
    'давление',
    'ммh2o',
    'mmh2o',
  ],
}

export const normalizeCpuRows = (rows: CsvRow[]): CpuTest[] =>
  rows
    .map((row) => {
      const modelName = normalizeWhitespace(pickCell(row, COMMON_ALIASES.model))
      if (!modelName) {
        return null
      }

      const cpuTempAt46Db = parseNumber(pickCell(row, ['темп на 46дб', 'темп. на 46дб', 'temp at 46db']))
      const cpuTempMaxRpm = parseNumber(
        pickCell(row, ['темп на махоб', 'темп. на мах.об.', 'темп на max', 'cpu temp max']),
      )

      const noiseMaxDb = parseNumber(
        pickCell(row, ['шум на махоб', 'шум на мах.об.', 'max noise', 'noise max']),
      )

      const rpm = parseRpm(pickCell(row, COMMON_ALIASES.rpm), modelName)
      const sizeMm = parseSize(pickCell(row, COMMON_ALIASES.size), modelName)
      const staticPressure = parseStaticPressure(pickCell(row, COMMON_ALIASES.staticPressure))
      const priceRub = parseNumber(pickCell(row, COMMON_ALIASES.price))

      const normalizedModel = normalizeFanName(modelName)

      const normalizedRow: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[normalizeWhitespace(key)] = normalizeWhitespace(value)
      }

      return {
        modelName,
        normalizedModel,
        cpuTempAt46Db,
        cpuTempMaxRpm,
        noiseMaxDb,
        rpm,
        sizeMm,
        staticPressure,
        priceRub,
        sourceRow: normalizedRow,
      } satisfies CpuTest
    })
    .filter((item): item is CpuTest => item !== null)

export const normalizeAnemometerRows = (rows: CsvRow[]): AnemometerTest[] =>
  rows
    .map((row) => {
      const modelName = normalizeWhitespace(pickCell(row, COMMON_ALIASES.model))
      if (!modelName) {
        return null
      }

      const airflowMax = parseNumber(
        pickCell(row, ['мах поток мс', 'мах. поток (мс)', 'max airflow', 'airflow max', 'поток max']),
      )

      const noiseMaxDb = parseNumber(
        pickCell(row, ['мах шумфон41дб', 'мах. шум；фон 41дб.', 'max noise', 'noise max']),
      )

      const airflowAt43Db = parseNumber(
        pickCell(row, ['поток на 43дб', 'airflow at 43db', 'flow at 43db']),
      )

      const airflowAt1500Rpm = parseNumber(
        pickCell(row, ['поток на 1500об', 'поток на 1500об.', 'airflow at 1500', 'flow at 1500']),
      )

      const noiseAt1500Rpm = parseNumber(
        pickCell(row, ['шум на 1500об', 'шум на 1500об.', 'noise at 1500']),
      )

      const rpm = parseRpm(pickCell(row, COMMON_ALIASES.rpm), modelName)
      const sizeMm = parseSize(pickCell(row, COMMON_ALIASES.size), modelName)
      const staticPressure = parseStaticPressure(pickCell(row, COMMON_ALIASES.staticPressure))
      const priceRub = parseNumber(pickCell(row, COMMON_ALIASES.price))

      const normalizedModel = normalizeFanName(modelName)

      const normalizedRow: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[normalizeWhitespace(key)] = normalizeWhitespace(value)
      }

      return {
        modelName,
        normalizedModel,
        airflowMax,
        noiseMaxDb,
        airflowAt43Db,
        airflowAt1500Rpm,
        noiseAt1500Rpm,
        rpm,
        sizeMm,
        staticPressure,
        priceRub,
        sourceRow: normalizedRow,
      } satisfies AnemometerTest
    })
    .filter((item): item is AnemometerTest => item !== null)
