export type TestPresence = 'cpu' | 'anemometer' | 'both'

export interface CpuTest {
  modelName: string
  normalizedModel: string
  cpuTempAt46Db: number | null
  cpuTempMaxRpm: number | null
  noiseMaxDb: number | null
  rpm: number | null
  sizeMm: number | null
  staticPressure: number | null
  priceRub: number | null
  sourceRow: Record<string, string>
}

export interface AnemometerTest {
  modelName: string
  normalizedModel: string
  airflowMax: number | null
  noiseMaxDb: number | null
  airflowAt43Db: number | null
  airflowAt1500Rpm: number | null
  noiseAt1500Rpm: number | null
  rpm: number | null
  sizeMm: number | null
  staticPressure: number | null
  priceRub: number | null
  sourceRow: Record<string, string>
}

export interface FanScores {
  performanceScore: number
  silenceScore: number
  airflowScore: number
  cpuCoolingScore: number
  balancedScore: number
  valueScore: number | null
  efficiencyPerNoise: number | null
  airflowPerNoise: number | null
}

export interface FanInsight {
  bestChoice: boolean
  bestSilent: boolean
  bestAirflow: boolean
  goodBalance: boolean
  controversial: boolean
  weak: boolean
  verdict: string
  strengths: string[]
  weaknesses: string[]
}

export interface MergedFanData {
  id: string
  modelName: string
  normalizedModel: string
  brand: string
  sizeMm: number | null
  rpm: number | null
  priceRub: number | null
  testPresence: TestPresence
  cpu: CpuTest | null
  anemometer: AnemometerTest | null
  scores: FanScores
  insight: FanInsight
}

export interface PossibleMatch {
  cpuModel: string
  anemometerModel: string
  score: number
}

export interface MergeDiagnostics {
  unmatchedCpu: string[]
  unmatchedAnemometer: string[]
  possibleMatches: PossibleMatch[]
}

export interface RankingSnapshot {
  overall: string | null
  silent: string | null
  cpuCooling: string | null
  airflow: string | null
  balanced: string | null
  value: string | null
}

export interface DataLoadMeta {
  usedDemoData: boolean
  sourceMode: 'local-csv' | 'public-url' | 'mixed' | 'demo'
  cpuSource: string
  anemometerSource: string
  loadedAt: string
  warnings: string[]
}

export interface FanDataset {
  fans: MergedFanData[]
  diagnostics: MergeDiagnostics
  rankings: RankingSnapshot
  meta: DataLoadMeta
}

export interface DataSourceConfig {
  cpuCsvPath: string
  anemometerCsvPath: string
  cpuCsvUrl: string
  anemometerCsvUrl: string
  preferPublicUrls: boolean
}

export interface RangeFilter {
  min: number | null
  max: number | null
}

export interface FanFilters {
  brands: string[]
  sizes: number[]
  rpmRange: RangeFilter
  noiseRange: RangeFilter
  priceRange: RangeFilter
  testPresence: TestPresence | 'all'
  onlyBothSources: boolean
}

export type SortMode =
  | 'overall'
  | 'cpuTemp'
  | 'airflow'
  | 'noise'
  | 'balance'
  | 'value'
  | 'rpm'
  | 'size'
  | 'brand'
