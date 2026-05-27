import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MergedFanData } from '../types/fan'
import { formatNumber } from '../utils/numbers'
import { compareAirflow, compareCpuTemp, compareNoise } from '../utils/scoring'

interface ComparePanelProps {
  selectedFans: MergedFanData[]
}

interface MetricSpec {
  key: string
  label: string
  value: (fan: MergedFanData) => number | null
  color: string
  better: 'higher' | 'lower'
  suffix: string
}

const metricSpecs: MetricSpec[] = [
  {
    key: 'cpuTemp',
    label: 'Температура CPU',
    value: compareCpuTemp,
    color: '#22d3ee',
    better: 'lower',
    suffix: '°C',
  },
  {
    key: 'noise',
    label: 'Шум',
    value: compareNoise,
    color: '#34d399',
    better: 'lower',
    suffix: 'dB',
  },
  {
    key: 'airflow',
    label: 'Airflow',
    value: compareAirflow,
    color: '#60a5fa',
    better: 'higher',
    suffix: 'm/s',
  },
  {
    key: 'efficiencyPerNoise',
    label: 'Эффективность на 1 dB',
    value: (fan) => fan.scores.efficiencyPerNoise,
    color: '#f59e0b',
    better: 'higher',
    suffix: '',
  },
  {
    key: 'value',
    label: 'Эффективность за цену',
    value: (fan) => fan.scores.valueScore,
    color: '#a78bfa',
    better: 'higher',
    suffix: '',
  },
]

export const ComparePanel = ({ selectedFans }: ComparePanelProps) => {
  if (selectedFans.length < 2) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-base font-semibold text-slate-100">Сравнение (2–4 модели)</h3>
        <p className="mt-2 text-sm text-slate-400">
          Отметьте минимум 2 вентилятора в таблице, чтобы открыть сравнительный dashboard.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-base font-semibold text-slate-100">Сравнение моделей</h3>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {selectedFans.map((fan) => (
          <article key={fan.id} className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
            <p className="text-sm font-semibold text-slate-100">{fan.modelName}</p>
            <p className="text-xs text-slate-400">{fan.brand}</p>
            <div className="mt-3 space-y-1 text-xs text-slate-300">
              <p>Performance: {fan.scores.performanceScore.toFixed(1)}</p>
              <p>Silence: {fan.scores.silenceScore.toFixed(1)}</p>
              <p>Airflow score: {fan.scores.airflowScore.toFixed(1)}</p>
              <p>Balanced: {fan.scores.balancedScore.toFixed(1)}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-3">Метрика</th>
              {selectedFans.map((fan) => (
                <th key={fan.id} className="px-2 py-2">
                  {fan.modelName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricSpecs.map((metric) => {
              const metricValues = selectedFans.map((fan) => metric.value(fan)).filter((value): value is number => value !== null)
              const bestValue =
                metric.better === 'higher'
                  ? Math.max(...metricValues)
                  : Math.min(...metricValues)

              return (
                <tr key={metric.key} className="border-b border-slate-800/80">
                  <td className="py-2 pr-3 text-slate-300">{metric.label}</td>
                  {selectedFans.map((fan) => {
                    const value = metric.value(fan)
                    const isBest =
                      value !== null &&
                      metricValues.length > 0 &&
                      ((metric.better === 'higher' && value === bestValue) ||
                        (metric.better === 'lower' && value === bestValue))

                    return (
                      <td key={fan.id + metric.key} className="px-2 py-2">
                        <span
                          className={`rounded px-2 py-1 ${
                            isBest
                              ? 'bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-500/40'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {formatNumber(value, { fractionDigits: 2, suffix: metric.suffix ? ` ${metric.suffix}` : '' })}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {metricSpecs.map((metric) => {
          const data = selectedFans
            .map((fan) => ({
              name: fan.modelName,
              value: metric.value(fan),
            }))
            .filter((row): row is { name: string; value: number } => row.value !== null)

          return (
            <div key={metric.key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">{metric.label}</p>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      angle={-28}
                      textAnchor="end"
                      interval={0}
                      height={65}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => [Number(value).toFixed(2), metric.label]}
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(71,85,105,0.6)',
                      }}
                    />
                    <Bar dataKey="value" fill={metric.color} radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
