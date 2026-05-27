import Papa from 'papaparse'

export type CsvRow = Record<string, string>

export const parseCsv = (raw: string): CsvRow[] => {
  const parsed = Papa.parse<CsvRow>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    const firstError = parsed.errors[0]
    throw new Error(`CSV parse error (${firstError.code}): ${firstError.message}`)
  }

  return parsed.data.map((row) => {
    const normalized: CsvRow = {}
    for (const [key, value] of Object.entries(row)) {
      normalized[key.trim()] = String(value ?? '').trim()
    }
    return normalized
  })
}

export const fetchCsvText = async (source: string): Promise<string> => {
  const response = await fetch(source, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV from ${source} (${response.status})`)
  }

  return response.text()
}

export const loadCsvFromSource = async (source: string): Promise<CsvRow[]> => {
  const text = await fetchCsvText(source)
  return parseCsv(text)
}
