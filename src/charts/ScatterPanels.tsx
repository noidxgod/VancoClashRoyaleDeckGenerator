import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MergedFanData } from '../types/fan'
import { compareAirflow, compareCpuTemp, compareNoise } from '../utils/scoring'

export const ScatterPanels = ({ fans }: { fans: MergedFanData[] }) => {
  const noiseVsTemp = fans
    .map((fan) => ({
      name: fan.modelName,
      noise: compareNoise(fan),
      temp: compareCpuTemp(fan),
    }))
    .filter((item): item is { name: string; noise: number; temp: number } =>
      item.noise !== null && item.temp !== null,
    )

  const airflowVsNoise = fans
    .map((fan) => ({
      name: fan.modelName,
      noise: compareNoise(fan),
      airflow: compareAirflow(fan),
    }))
    .filter((item): item is { name: string; noise: number; airflow: number } =>
      item.noise !== null && item.airflow !== null,
    )

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-100">Scatter: шум vs температура CPU</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 12, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis type="number" dataKey="noise" name="Noise" unit=" dB" tick={{ fill: '#94a3b8' }} />
              <YAxis type="number" dataKey="temp" name="CPU temp" unit="°C" tick={{ fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, key) => [Number(value).toFixed(2), String(key ?? 'value')]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(71,85,105,0.6)',
                }}
              />
              <Legend />
              <Scatter name="Fans" data={noiseVsTemp} fill="#22d3ee" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-100">Scatter: airflow vs noise</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 12, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis type="number" dataKey="noise" name="Noise" unit=" dB" tick={{ fill: '#94a3b8' }} />
              <YAxis type="number" dataKey="airflow" name="Airflow" unit=" m/s" tick={{ fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, key) => [Number(value).toFixed(2), String(key ?? 'value')]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(71,85,105,0.6)',
                }}
              />
              <Legend />
              <Scatter name="Fans" data={airflowVsNoise} fill="#34d399" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
