import { useState } from 'react'
import { useFanData } from '../data/FanDataContext'

export const DataSourcePanel = () => {
  const { config, updateConfig, dataset, loading } = useFanData()

  const [localCpu, setLocalCpu] = useState(config.cpuCsvPath)
  const [localAnemo, setLocalAnemo] = useState(config.anemometerCsvPath)
  const [urlCpu, setUrlCpu] = useState(config.cpuCsvUrl)
  const [urlAnemo, setUrlAnemo] = useState(config.anemometerCsvUrl)
  const [preferPublic, setPreferPublic] = useState(config.preferPublicUrls)

  const applySources = (): void => {
    updateConfig({
      cpuCsvPath: localCpu.trim(),
      anemometerCsvPath: localAnemo.trim(),
      cpuCsvUrl: urlCpu.trim(),
      anemometerCsvUrl: urlAnemo.trim(),
      preferPublicUrls: preferPublic,
    })
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-[0_0_40px_rgba(14,116,144,0.2)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-50">Источники данных</h2>
          <p className="text-xs text-slate-400">
            Поддерживаются локальные CSV и Google Sheets public CSV URL.
          </p>
        </div>

        <button
          type="button"
          onClick={() => applySources()}
          disabled={loading}
          className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
        >
          Применить и обновить
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-slate-300">CPU CSV (local path)</span>
          <input
            value={localCpu}
            onChange={(event) => setLocalCpu(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-cyan-500/50 focus:ring"
            placeholder="/data/cpu-tests.csv"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-300">Anemometer CSV (local path)</span>
          <input
            value={localAnemo}
            onChange={(event) => setLocalAnemo(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-cyan-500/50 focus:ring"
            placeholder="/data/anemometer-tests.csv"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-300">CPU Google Sheets CSV URL</span>
          <input
            value={urlCpu}
            onChange={(event) => setUrlCpu(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-cyan-500/50 focus:ring"
            placeholder="https://docs.google.com/.../export?format=csv&gid=0"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-300">Anemometer Google Sheets CSV URL</span>
          <input
            value={urlAnemo}
            onChange={(event) => setUrlAnemo(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-cyan-500/50 focus:ring"
            placeholder="https://docs.google.com/.../export?format=csv&gid=0"
          />
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={preferPublic}
          onChange={(event) => setPreferPublic(event.target.checked)}
          className="h-4 w-4 accent-cyan-400"
        />
        Сначала пробовать public URL, потом local CSV
      </label>

      {dataset && dataset.meta.warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-600/50 bg-amber-900/25 p-3 text-xs text-amber-200">
          <p className="font-semibold">Диагностика загрузки:</p>
          <ul className="mt-2 space-y-1">
            {dataset.meta.warnings.slice(0, 4).map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
