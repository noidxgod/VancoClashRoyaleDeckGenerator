import type { MergedFanData } from '../types/fan'
import { formatNumber } from '../utils/numbers'
import { compareAirflow, compareCpuTemp, compareNoise } from '../utils/scoring'
import { scoreBandClass } from '../utils/ui'

interface FanTableProps {
  fans: MergedFanData[]
  onSelectFan: (fan: MergedFanData) => void
  compareIds: string[]
  onToggleCompare: (fanId: string) => void
}

export const FanTable = ({ fans, onSelectFan, compareIds, onToggleCompare }: FanTableProps) => (
  <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65">
    <div className="max-h-[680px] overflow-auto">
      <table className="min-w-[1200px] w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-3">Сравнить</th>
            <th className="px-3 py-3">Модель</th>
            <th className="px-3 py-3">Бренд</th>
            <th className="px-3 py-3">Размер</th>
            <th className="px-3 py-3">RPM</th>
            <th className="px-3 py-3">CPU, °C</th>
            <th className="px-3 py-3">Шум, дБ</th>
            <th className="px-3 py-3">Airflow, м/с</th>
            <th className="px-3 py-3">Цена, ₽</th>
            <th className="px-3 py-3">Eff/Noise</th>
            <th className="px-3 py-3">Eff/Price</th>
            <th className="px-3 py-3">Итоговый рейтинг</th>
          </tr>
        </thead>

        <tbody>
          {fans.map((fan) => {
            const isCompared = compareIds.includes(fan.id)
            const cpuTemp = compareCpuTemp(fan)
            const noise = compareNoise(fan)
            const airflow = compareAirflow(fan)

            return (
              <tr
                key={fan.id}
                className="cursor-pointer border-t border-slate-800/80 transition hover:bg-slate-800/40"
                onClick={() => onSelectFan(fan)}
              >
                <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isCompared}
                    onChange={() => onToggleCompare(fan.id)}
                    className="h-4 w-4 accent-cyan-400"
                    aria-label={`Сравнить ${fan.modelName}`}
                  />
                </td>
                <td className="px-3 py-2 font-medium text-slate-100">{fan.modelName}</td>
                <td className="px-3 py-2 capitalize text-slate-300">{fan.brand}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(fan.sizeMm, { fractionDigits: 0, suffix: ' мм' })}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(fan.rpm, { fractionDigits: 0 })}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(cpuTemp)}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(noise)}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(airflow)}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(fan.priceRub, { fractionDigits: 0 })}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(fan.scores.efficiencyPerNoise, { fractionDigits: 3 })}</td>
                <td className="px-3 py-2 text-slate-300">{formatNumber(fan.scores.valueScore, { fractionDigits: 1 })}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex min-w-14 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${scoreBandClass(
                      fan.scores.performanceScore,
                    )}`}
                  >
                    {fan.scores.performanceScore.toFixed(1)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </section>
)
