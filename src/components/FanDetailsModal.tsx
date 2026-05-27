import { useMemo } from 'react'
import type { MergedFanData } from '../types/fan'
import { formatNumber } from '../utils/numbers'
import { compareAirflow, compareCpuTemp, compareNoise } from '../utils/scoring'
import { FanRadarChart } from '../charts/FanRadarChart'

interface FanDetailsModalProps {
  fan: MergedFanData
  allFans: MergedFanData[]
  onClose: () => void
}

const rowToPairs = (row: Record<string, string>): Array<[string, string]> =>
  Object.entries(row).filter(([, value]) => value.trim() !== '')

export const FanDetailsModal = ({ fan, allFans, onClose }: FanDetailsModalProps) => {
  const rank = useMemo(() => {
    const sorted = [...allFans].sort((a, b) => b.scores.performanceScore - a.scores.performanceScore)
    const index = sorted.findIndex((item) => item.id === fan.id)
    return index >= 0 ? index + 1 : null
  }, [allFans, fan.id])

  const cpuTemp = compareCpuTemp(fan)
  const noise = compareNoise(fan)
  const airflow = compareAirflow(fan)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-700 bg-slate-900/95 px-5 py-4 backdrop-blur">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">{fan.modelName}</h3>
            <p className="text-sm text-slate-400">
              Бренд: {fan.brand} · Место в общем рейтинге: {rank ?? '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Закрыть
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="text-sm font-semibold text-slate-100">Сводка</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <p>CPU temp: {formatNumber(cpuTemp)}</p>
              <p>Noise: {formatNumber(noise)}</p>
              <p>Airflow: {formatNumber(airflow)}</p>
              <p>RPM: {formatNumber(fan.rpm, { fractionDigits: 0 })}</p>
              <p>Size: {formatNumber(fan.sizeMm, { fractionDigits: 0, suffix: ' мм' })}</p>
              <p>Price: {formatNumber(fan.priceRub, { fractionDigits: 0, suffix: ' ₽' })}</p>
              <p>Performance: {fan.scores.performanceScore.toFixed(1)}</p>
              <p>Balanced: {fan.scores.balancedScore.toFixed(1)}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-cyan-300">Вердикт</p>
              <p className="mt-1 text-sm text-slate-200">{fan.insight.verdict}</p>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-300">Сильные стороны</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {(fan.insight.strengths.length > 0 ? fan.insight.strengths : ['Не выделены']).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-rose-300">Слабые стороны</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {(fan.insight.weaknesses.length > 0 ? fan.insight.weaknesses : ['Не выявлены']).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="text-sm font-semibold text-slate-100">Radar профиль</h4>
            <FanRadarChart fan={fan} />
          </article>
        </div>

        <div className="grid gap-4 px-5 pb-5 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h4 className="text-sm font-semibold text-slate-100">CPU тест (сырой ряд)</h4>
            {fan.cpu ? (
              <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-xs text-slate-300">
                {rowToPairs(fan.cpu.sourceRow).map(([key, value]) => (
                  <li key={key} className="grid grid-cols-2 gap-2 border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">{key}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Нет CPU данных для этой модели.</p>
            )}
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h4 className="text-sm font-semibold text-slate-100">Анемометр тест (сырой ряд)</h4>
            {fan.anemometer ? (
              <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-xs text-slate-300">
                {rowToPairs(fan.anemometer.sourceRow).map(([key, value]) => (
                  <li key={key} className="grid grid-cols-2 gap-2 border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">{key}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Нет данных анемометра для этой модели.</p>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
