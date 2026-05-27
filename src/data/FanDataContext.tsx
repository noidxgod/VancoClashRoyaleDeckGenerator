/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { DEFAULT_DATA_SOURCE_CONFIG } from './constants'
import { loadFanDataset } from './loadFanDataset'
import type { DataSourceConfig, FanDataset } from '../types/fan'

interface FanDataContextValue {
  dataset: FanDataset | null
  loading: boolean
  error: string | null
  config: DataSourceConfig
  reload: () => Promise<void>
  updateConfig: (next: Partial<DataSourceConfig>) => void
}

const STORAGE_KEY = 'fan-benchmark-source-config-v1'

const FanDataContext = createContext<FanDataContextValue | null>(null)

const readStoredConfig = (): DataSourceConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_DATA_SOURCE_CONFIG
    }

    const parsed = JSON.parse(raw) as Partial<DataSourceConfig>
    return { ...DEFAULT_DATA_SOURCE_CONFIG, ...parsed }
  } catch {
    return DEFAULT_DATA_SOURCE_CONFIG
  }
}

export const FanDataProvider = ({ children }: PropsWithChildren) => {
  const [dataset, setDataset] = useState<FanDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<DataSourceConfig>(() => readStoredConfig())

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const loaded = await loadFanDataset(config)
      setDataset(loaded)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unknown loading error'
      setError(message)
      setDataset(null)
    } finally {
      setLoading(false)
    }
  }, [config])

  useEffect(() => {
    void reload()
  }, [reload])

  const updateConfig = useCallback((next: Partial<DataSourceConfig>) => {
    setConfig((previous) => {
      const merged = { ...previous, ...next }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return merged
    })
  }, [])

  const value = useMemo(
    () => ({ dataset, loading, error, config, reload, updateConfig }),
    [dataset, loading, error, config, reload, updateConfig],
  )

  return <FanDataContext.Provider value={value}>{children}</FanDataContext.Provider>
}

export const useFanData = (): FanDataContextValue => {
  const context = useContext(FanDataContext)
  if (!context) {
    throw new Error('useFanData must be used inside FanDataProvider')
  }

  return context
}
