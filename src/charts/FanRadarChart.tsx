import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { MergedFanData } from '../types/fan'

export const FanRadarChart = ({ fan }: { fan: MergedFanData }) => {
  const data = [
    { metric: 'Performance', value: fan.scores.performanceScore },
    { metric: 'Silence', value: fan.scores.silenceScore },
    { metric: 'Airflow', value: fan.scores.airflowScore },
    { metric: 'CPU Cooling', value: fan.scores.cpuCoolingScore },
    { metric: 'Balanced', value: fan.scores.balancedScore },
    { metric: 'Value', value: fan.scores.valueScore ?? 0 },
  ]

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(148,163,184,0.25)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="#22d3ee"
            fill="#22d3ee"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
