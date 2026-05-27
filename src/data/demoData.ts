import type { AnemometerTest, CpuTest } from '../types/fan'
import { normalizeFanName } from '../utils/strings'

const cpuDemoRows: Array<Omit<CpuTest, 'normalizedModel'>> = [
  {
    modelName: 'Demo SilentWind 120',
    cpuTempAt46Db: 82,
    cpuTempMaxRpm: 78,
    noiseMaxDb: 47,
    rpm: 1800,
    sizeMm: 120,
    staticPressure: 2.2,
    priceRub: 1200,
    sourceRow: {},
  },
  {
    modelName: 'Demo TurboFlow X120',
    cpuTempAt46Db: 80,
    cpuTempMaxRpm: 75,
    noiseMaxDb: 56,
    rpm: 2600,
    sizeMm: 120,
    staticPressure: 3.1,
    priceRub: 1400,
    sourceRow: {},
  },
  {
    modelName: 'Demo Budget Breeze',
    cpuTempAt46Db: 85,
    cpuTempMaxRpm: 81,
    noiseMaxDb: 50,
    rpm: 1700,
    sizeMm: 120,
    staticPressure: 1.9,
    priceRub: 700,
    sourceRow: {},
  },
  {
    modelName: 'Demo Airforce Pro',
    cpuTempAt46Db: 79,
    cpuTempMaxRpm: 74,
    noiseMaxDb: 58,
    rpm: 3000,
    sizeMm: 120,
    staticPressure: 3.4,
    priceRub: 2200,
    sourceRow: {},
  },
]

const anemoDemoRows: Array<Omit<AnemometerTest, 'normalizedModel'>> = [
  {
    modelName: 'Demo SilentWind 120',
    airflowMax: 5.6,
    noiseMaxDb: 48,
    airflowAt43Db: 4.1,
    airflowAt1500Rpm: 4,
    noiseAt1500Rpm: 41,
    rpm: 1800,
    sizeMm: 120,
    staticPressure: 2.2,
    priceRub: 1200,
    sourceRow: {},
  },
  {
    modelName: 'Demo TurboFlow X120',
    airflowMax: 7.2,
    noiseMaxDb: 57,
    airflowAt43Db: 4.4,
    airflowAt1500Rpm: 4.2,
    noiseAt1500Rpm: 44,
    rpm: 2600,
    sizeMm: 120,
    staticPressure: 3.1,
    priceRub: 1400,
    sourceRow: {},
  },
  {
    modelName: 'Demo Budget Breeze',
    airflowMax: 5.1,
    noiseMaxDb: 51,
    airflowAt43Db: 3.7,
    airflowAt1500Rpm: 3.5,
    noiseAt1500Rpm: 42,
    rpm: 1700,
    sizeMm: 120,
    staticPressure: 1.9,
    priceRub: 700,
    sourceRow: {},
  },
  {
    modelName: 'Demo Airforce Pro',
    airflowMax: 7.8,
    noiseMaxDb: 60,
    airflowAt43Db: 4.8,
    airflowAt1500Rpm: 4.6,
    noiseAt1500Rpm: 45,
    rpm: 3000,
    sizeMm: 120,
    staticPressure: 3.4,
    priceRub: 2200,
    sourceRow: {},
  },
]

export const demoCpuTests: CpuTest[] = cpuDemoRows.map((item) => ({
  ...item,
  normalizedModel: normalizeFanName(item.modelName),
}))

export const demoAnemometerTests: AnemometerTest[] = anemoDemoRows.map((item) => ({
  ...item,
  normalizedModel: normalizeFanName(item.modelName),
}))
