import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { FanImage } from '../components/FanImage'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { useFanData } from '../data/FanDataContext'
import type { MergedFanData } from '../types/fan'
import { buildStrictFanImageFileName } from '../utils/fanImages'
import { formatNumber } from '../utils/numbers'
import { compareAirflow, compareCpuTemp, compareNoise } from '../utils/scoring'
import { scoreBandClass } from '../utils/ui'
import { SpinningFan } from '../visuals/SpinningFan'

type ShowcaseMode = 'performance' | 'silence' | 'balanced' | 'value'
type TestScope = 'all' | 'cpu' | 'anemometer'

const sectionTitles: Record<ShowcaseMode, string> = {
  performance: 'Top Performers',
  silence: 'Best Silent Fans',
  balanced: 'Best Balanced',
  value: 'Best Value',
}

const sortByMode = (fans: MergedFanData[], mode: ShowcaseMode): MergedFanData[] => {
  const sorted = [...fans]
  switch (mode) {
    case 'silence':
      return sorted.sort((a, b) => b.scores.silenceScore - a.scores.silenceScore)
    case 'balanced':
      return sorted.sort((a, b) => b.scores.balancedScore - a.scores.balancedScore)
    case 'value':
      return sorted.sort((a, b) => (b.scores.valueScore ?? -1) - (a.scores.valueScore ?? -1))
    case 'performance':
    default:
      return sorted.sort((a, b) => b.scores.performanceScore - a.scores.performanceScore)
  }
}

const modeLabel: Record<ShowcaseMode, string> = {
  performance: 'Performance',
  silence: 'Silence',
  balanced: 'Balanced',
  value: 'Value',
}

export const ShowcasePage = () => {
  const { dataset, loading, error } = useFanData()

  const [mode, setMode] = useState<ShowcaseMode>('performance')
  const [testScope, setTestScope] = useState<TestScope>('all')
  const [compareIds, setCompareIds] = useState<string[]>([])

  const fans = useMemo(() => dataset?.fans ?? [], [dataset])

  const scopedFans = useMemo(() => {
    switch (testScope) {
      case 'cpu':
        return fans.filter((fan) => fan.cpu)
      case 'anemometer':
        return fans.filter((fan) => fan.anemometer)
      case 'all':
      default:
        return fans
    }
  }, [fans, testScope])

  const sortedFans = useMemo(() => sortByMode(scopedFans, mode), [scopedFans, mode])

  const topPerformers = useMemo(() => sortByMode(scopedFans, 'performance').slice(0, 6), [scopedFans])
  const bestSilent = useMemo(() => sortByMode(scopedFans, 'silence').slice(0, 6), [scopedFans])
  const airflowKings = useMemo(
    () => [...scopedFans].sort((a, b) => (compareAirflow(b) ?? -1) - (compareAirflow(a) ?? -1)).slice(0, 6),
    [scopedFans],
  )
  const cpuLeaders = useMemo(
    () => [...scopedFans].sort((a, b) => (compareCpuTemp(a) ?? 999) - (compareCpuTemp(b) ?? 999)).slice(0, 6),
    [scopedFans],
  )
  const balanced = useMemo(() => sortByMode(scopedFans, 'balanced').slice(0, 6), [scopedFans])

  const compareFans = useMemo(
    () => compareIds.map((id) => fans.find((fan) => fan.id === id)).filter((fan): fan is MergedFanData => !!fan),
    [compareIds, fans],
  )

  const heroStats = useMemo(() => {
    const bestCpu = [...fans].sort((a, b) => (compareCpuTemp(a) ?? 999) - (compareCpuTemp(b) ?? 999))[0]
    const bestAir = [...fans].sort((a, b) => (compareAirflow(b) ?? -1) - (compareAirflow(a) ?? -1))[0]
    const quiet = [...fans].sort((a, b) => (compareNoise(a) ?? 999) - (compareNoise(b) ?? 999))[0]

    return {
      total: fans.length,
      bestCpu: bestCpu?.modelName ?? '—',
      bestAir: bestAir?.modelName ?? '—',
      quiet: quiet?.modelName ?? '—',
    }
  }, [fans])

  const requiredImageFiles = useMemo(
    () =>
      Array.from(new Set(fans.map((fan) => buildStrictFanImageFileName(fan.modelName)))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [fans],
  )

  const toggleCompare = (fanId: string): void => {
    setCompareIds((previous) => {
      if (previous.includes(fanId)) {
        return previous.filter((item) => item !== fanId)
      }
      if (previous.length >= 4) {
        return previous
      }
      return [...previous, fanId]
    })
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!dataset || fans.length === 0) {
    return <EmptyState />
  }

  const renderFanGrid = (title: string, collection: MergedFanData[], gradient: string) => (
    <section className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-['Orbitron'] text-lg tracking-wide text-slate-100">{title}</h2>
        <p className="text-xs text-slate-400">{collection.length} models</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {collection.map((fan, idx) => {
          const selected = compareIds.includes(fan.id)
          return (
            <motion.article
              key={fan.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className={`group rounded-xl border border-slate-700/70 bg-gradient-to-br ${gradient} p-3 shadow-[0_0_28px_rgba(56,189,248,0.08)]`}
            >
              <div className="relative overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950/60 p-2">
                <FanImage
                  modelName={fan.modelName}
                  alt={fan.modelName}
                  className="h-36 w-full object-contain transition duration-300 group-hover:scale-[1.04]"
                />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-100">{fan.modelName}</p>
              <p className="text-xs text-slate-400">{fan.brand}</p>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <p>CPU: {formatNumber(compareCpuTemp(fan), { suffix: '°C' })}</p>
                <p>Noise: {formatNumber(compareNoise(fan), { suffix: ' dB' })}</p>
                <p>Air: {formatNumber(compareAirflow(fan), { suffix: ' m/s' })}</p>
                <p>Price: {formatNumber(fan.priceRub, { fractionDigits: 0, suffix: ' ₽' })}</p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${scoreBandClass(fan.scores.performanceScore)}`}>
                  {fan.scores.performanceScore.toFixed(1)}
                </span>

                <button
                  type="button"
                  onClick={() => toggleCompare(fan.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selected
                      ? 'bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-500/45'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {selected ? 'Добавлен' : 'Сравнить'}
                </button>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.28),transparent_38%),radial-gradient(circle_at_20%_85%,rgba(129,140,248,0.18),transparent_42%)]" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <h1 className="font-['Orbitron'] text-3xl font-semibold tracking-wide text-white md:text-4xl">
              PC Fan Benchmark Explorer
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
              Compare airflow, CPU cooling, noise and real-world performance across both test datasets.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Tested fans</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{heroStats.total}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Best CPU</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{heroStats.bestCpu}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Best airflow</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{heroStats.bestAir}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Quietest</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{heroStats.quiet}</p>
              </div>
            </div>
          </div>

          <div className="mx-auto">
            <SpinningFan size={300} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-['Orbitron'] text-lg tracking-wide text-slate-100">Требуемые изображения моделей</h2>
        <p className="mt-1 text-sm text-slate-300">
          Для каждой модели нужен отдельный файл в <code>/public/fans/</code> по шаблону
          <code> &lt;normalized-model&gt;.png</code>. Placeholder не используется.
        </p>
        <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-slate-700 bg-slate-950/50 p-3">
          <ul className="grid gap-1 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-3">
            {requiredImageFiles.map((fileName) => (
              <li key={fileName}>• {fileName}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(modeLabel) as ShowcaseMode[]).map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => setMode(variant)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                mode === variant
                  ? 'bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {modeLabel[variant]}
            </button>
          ))}

          <span className="mx-2 h-5 w-px bg-slate-700" />

          {(['all', 'cpu', 'anemometer'] as TestScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setTestScope(scope)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                testScope === scope
                  ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {scope === 'all' ? 'Both tests' : scope === 'cpu' ? 'CPU test' : 'Anemometer test'}
            </button>
          ))}
        </div>
      </section>

      {renderFanGrid(sectionTitles[mode], sortedFans.slice(0, 6), 'from-slate-900/80 to-cyan-900/10')}
      {renderFanGrid('Airflow Kings', airflowKings, 'from-slate-900/80 to-blue-900/10')}
      {renderFanGrid('CPU Cooling Leaders', cpuLeaders, 'from-slate-900/80 to-cyan-900/10')}
      {renderFanGrid('Best Silent Fans', bestSilent, 'from-slate-900/80 to-emerald-900/10')}
      {renderFanGrid('Best Balanced', balanced, 'from-slate-900/80 to-violet-900/10')}
      {renderFanGrid('Top Performers', topPerformers, 'from-slate-900/80 to-indigo-900/10')}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-['Orbitron'] text-lg tracking-wide text-slate-100">Compare Models</h2>
        <p className="mt-1 text-sm text-slate-400">Выберите 2-4 вентилятора в карточках выше.</p>

        {compareFans.length < 2 ? (
          <p className="mt-3 text-sm text-slate-300">Недостаточно моделей для сравнения.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {compareFans.map((fan) => (
              <article key={fan.id} className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <p className="text-sm font-semibold text-slate-100">{fan.modelName}</p>
                <p className="mt-2 text-xs text-slate-300">Performance</p>
                <div className="mt-1 h-2 rounded bg-slate-800">
                  <div className="h-2 rounded bg-cyan-400" style={{ width: `${fan.scores.performanceScore}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-300">Silence</p>
                <div className="mt-1 h-2 rounded bg-slate-800">
                  <div className="h-2 rounded bg-emerald-400" style={{ width: `${fan.scores.silenceScore}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-300">Balanced</p>
                <div className="mt-1 h-2 rounded bg-slate-800">
                  <div className="h-2 rounded bg-violet-400" style={{ width: `${fan.scores.balancedScore}%` }} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-['Orbitron'] text-lg tracking-wide text-slate-100">Full Benchmark Table</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-2 py-2">Model</th>
                <th className="px-2 py-2">CPU temp</th>
                <th className="px-2 py-2">Noise</th>
                <th className="px-2 py-2">Airflow</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {sortedFans.slice(0, 20).map((fan) => (
                <tr key={fan.id} className="border-t border-slate-800">
                  <td className="px-2 py-2 text-slate-100">{fan.modelName}</td>
                  <td className="px-2 py-2 text-slate-300">{formatNumber(compareCpuTemp(fan), { suffix: '°C' })}</td>
                  <td className="px-2 py-2 text-slate-300">{formatNumber(compareNoise(fan), { suffix: ' dB' })}</td>
                  <td className="px-2 py-2 text-slate-300">{formatNumber(compareAirflow(fan), { suffix: ' m/s' })}</td>
                  <td className="px-2 py-2 text-slate-300">{formatNumber(fan.priceRub, { fractionDigits: 0, suffix: ' ₽' })}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${scoreBandClass(fan.scores.performanceScore)}`}>
                      {fan.scores.performanceScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-300">{fan.insight.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
