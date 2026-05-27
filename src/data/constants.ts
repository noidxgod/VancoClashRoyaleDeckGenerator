import type { DataSourceConfig } from '../types/fan'

export const DEFAULT_CPU_PUBLIC_URL =
  'https://docs.google.com/spreadsheets/d/1MEWSP6nCv4o6Yg670ZVrD6x9EEbYfNRWXXxwe7eDDZo/export?format=csv&gid=0'

export const DEFAULT_ANEMO_PUBLIC_URL =
  'https://docs.google.com/spreadsheets/d/1TQ-TjOVmrkwR9WpNG9gFzrbUGilP7JpaFnq3xc-l84k/export?format=csv&gid=0'

export const DEFAULT_DATA_SOURCE_CONFIG: DataSourceConfig = {
  cpuCsvPath: '/data/cpu-tests.csv',
  anemometerCsvPath: '/data/anemometer-tests.csv',
  cpuCsvUrl: DEFAULT_CPU_PUBLIC_URL,
  anemometerCsvUrl: DEFAULT_ANEMO_PUBLIC_URL,
  preferPublicUrls: false,
}

export const MODEL_NORMALIZATION_STOP_WORDS = [
  'mm',
  'об',
  'rpm',
  'fan',
  'hight',
  'high',
  'speed',
  'edition',
  'extreme',
]

export const SIZE_REGEX = /(80|92|120|140|200)\s?(mm|мм)?/i
