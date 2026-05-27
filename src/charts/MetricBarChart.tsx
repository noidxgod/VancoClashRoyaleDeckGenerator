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

interface MetricBarChartProps {
  fans: MergedFanData[]
  title: string
  valueKey: (fan: MergedFanData) => number | null
  color?: string
  descending?: boolean
  fallbackLabel?: string
}

export const MetricBarChart = ({
  fans,
  title,
  valueKey,
  color = '#22d3ee',
  descending = true,
  fallbackLabel = '—',
}: MetricBarChartProps) => {
  const data = fans
    .map((fan) => ({
      name: fan.modelName,
      value: valueKey(fan),
    }))
    .filter((item): item is { name: string; value: number } => item.value !== null)
    .sort((a, b) => (descending ? b.value - a.value : a.value - b.value))
    .slice(0, 10)

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-100">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              angle={-28}
              textAnchor="end"
              interval={0}
              height={70}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(2), 'Значение']}
              labelFormatter={(value) => String(value)}
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(71,85,105,0.6)',
              }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color }}
            />
            <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.length === 0 && <p className="text-sm text-slate-400">{fallbackLabel}</p>}
    </section>
  )
}
