import { useMemo, useState } from 'react'
import { ComparePanel } from '../components/ComparePanel'
import { DataSourcePanel } from '../components/DataSourcePanel'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { FanDetailsModal } from '../components/FanDetailsModal'
import { FanTable } from '../components/FanTable'
import { FilterPanel } from '../components/FilterPanel'
import { HowScoringWorks } from '../components/HowScoringWorks'
import { RankingsPanel } from '../components/RankingsPanel'
import { ScatterPanels } from '../charts/ScatterPanels'
import { MetricBarChart } from '../charts/MetricBarChart'
import { useFanData } from '../data/FanDataContext'
import type { MergedFanData, SortMode } from '../types/fan'
import { exportFansAsCsv, exportFansAsJson } from '../utils/exporters'
import { applyFilters, buildDefaultFilters, listBrands, listSizes, sortFans } from '../utils/fanSelectors'
import { compareAirflow, compareCpuTemp, compareNoise } from '../utils/scoring'

export const AnalyticsPage = () => {
  const { dataset, loading, error } = useFanData()

  const [filters, setFilters] = useState(buildDefaultFilters)
  const [sortMode, setSortMode] = useState<SortMode>('overall')
  const [searchText, setSearchText] = useState('')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [selectedFan, setSelectedFan] = useState<MergedFanData | null>(null)

  const fans = useMemo(() => dataset?.fans ?? [], [dataset])

  const brands = useMemo(() => listBrands(fans), [fans])
  const sizes = useMemo(() => listSizes(fans), [fans])

  const filteredFans = useMemo(
    () => sortFans(applyFilters(fans, filters, searchText), sortMode),
    [fans, filters, searchText, sortMode],
  )

  const compareFans = useMemo(
    () => compareIds.map((id) => fans.find((fan) => fan.id === id)).filter((fan): fan is MergedFanData => !!fan),
    [compareIds, fans],
  )

  const insights = useMemo(() => {
    if (!dataset) {
      return []
    }

    const controversial = dataset.fans.filter((fan) => fan.insight.controversial).slice(0, 2)
    const weak = dataset.fans.filter((fan) => fan.insight.weak).slice(0, 2)

    const caseFan = [...dataset.fans]
      .sort((a, b) => b.scores.airflowScore + b.scores.silenceScore - (a.scores.airflowScore + a.scores.silenceScore))[0]

    const radiatorFan = [...dataset.fans]
      .sort((a, b) => b.scores.cpuCoolingScore - a.scores.cpuCoolingScore)[0]

    return [
      `Лучший выбор в целом: ${dataset.rankings.overall ?? 'н/д'}.`,
      `Самый тихий: ${dataset.rankings.silent ?? 'н/д'}.`,
      `Лучшее охлаждение CPU: ${dataset.rankings.cpuCooling ?? 'н/д'}.`,
      `Лучший airflow: ${dataset.rankings.airflow ?? 'н/д'}.`,
      `Баланс шум/эффективность: ${dataset.rankings.balanced ?? 'н/д'}.`,
      caseFan
        ? `Для корпуса чаще всего подходит: ${caseFan.modelName} (airflow + тишина).`
        : 'Недостаточно данных для рекомендации по корпусу.',
      radiatorFan
        ? `Для радиатора/CPU-кулера: ${radiatorFan.modelName} (приоритет охлаждения CPU).`
        : 'Недостаточно данных для рекомендации по радиатору.',
      controversial.length > 0
        ? `Спорные результаты: ${controversial.map((fan) => fan.modelName).join(', ')}.`
        : 'Ярко спорных результатов не выявлено.',
      weak.length > 0
        ? `Модели, которые стоит проверить критичнее: ${weak.map((fan) => fan.modelName).join(', ')}.`
        : 'Явно слабых моделей по текущим данным нет.',
    ]
  }, [dataset])

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

  if (!dataset) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      <DataSourcePanel />

      <RankingsPanel rankings={dataset.rankings} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Автоматические выводы</h2>
            <p className="text-xs text-slate-400">Ответы на практические вопросы по выбору вентилятора</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportFansAsJson(filteredFans)}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Скачать JSON
            </button>
            <button
              type="button"
              onClick={() => exportFansAsCsv(filteredFans)}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Скачать CSV
            </button>
          </div>
        </div>

        <ul className="grid gap-2 text-sm text-slate-200 md:grid-cols-2">
          {insights.map((item) => (
            <li key={item} className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <FilterPanel
        brands={brands}
        sizes={sizes}
        filters={filters}
        onFiltersChange={setFilters}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />

      {filteredFans.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FanTable
            fans={filteredFans}
            onSelectFan={setSelectedFan}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
          />

          <ComparePanel selectedFans={compareFans} />

          <div className="grid gap-4 xl:grid-cols-2">
            <MetricBarChart
              fans={filteredFans}
              title="Top airflow"
              valueKey={(fan) => compareAirflow(fan)}
              color="#60a5fa"
            />
            <MetricBarChart
              fans={filteredFans}
              title="Top CPU cooling (меньше °C лучше)"
              valueKey={(fan) => compareCpuTemp(fan)}
              color="#22d3ee"
              descending={false}
            />
            <MetricBarChart
              fans={filteredFans}
              title="Лучшие тихие (меньше дБ лучше)"
              valueKey={(fan) => compareNoise(fan)}
              color="#34d399"
              descending={false}
            />
            <MetricBarChart
              fans={filteredFans}
              title="Лучший баланс"
              valueKey={(fan) => fan.scores.balancedScore}
              color="#a78bfa"
            />
          </div>

          <ScatterPanels fans={filteredFans} />

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Диагностика объединения таблиц</h3>
            <div className="mt-2 grid gap-3 text-xs text-slate-300 md:grid-cols-3">
              <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                <p className="font-semibold text-slate-100">Unmatched CPU</p>
                <p className="mt-1">{dataset.diagnostics.unmatchedCpu.length}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                <p className="font-semibold text-slate-100">Unmatched Anemometer</p>
                <p className="mt-1">{dataset.diagnostics.unmatchedAnemometer.length}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                <p className="font-semibold text-slate-100">Possible fuzzy matches</p>
                <p className="mt-1">{dataset.diagnostics.possibleMatches.length}</p>
              </div>
            </div>

            {dataset.diagnostics.possibleMatches.length > 0 && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-xs text-amber-200">
                {dataset.diagnostics.possibleMatches.slice(0, 12).map((match) => (
                  <li key={`${match.cpuModel}-${match.anemometerModel}`}>
                    • {match.cpuModel} ↔ {match.anemometerModel} (score {match.score})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <HowScoringWorks />
        </>
      )}

      {selectedFan && <FanDetailsModal fan={selectedFan} allFans={fans} onClose={() => setSelectedFan(null)} />}
    </div>
  )
}
