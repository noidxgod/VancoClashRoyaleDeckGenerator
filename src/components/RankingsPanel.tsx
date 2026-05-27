import type { RankingSnapshot } from '../types/fan'

interface RankingsPanelProps {
  rankings: RankingSnapshot
}

const labels: Array<{ key: keyof RankingSnapshot; title: string; subtitle: string }> = [
  { key: 'overall', title: 'Лучший в целом', subtitle: 'Максимальный performanceScore' },
  { key: 'silent', title: 'Лучший тихий', subtitle: 'Минимум шума / максимум silenceScore' },
  { key: 'cpuCooling', title: 'Лидер CPU cooling', subtitle: 'Лучшее охлаждение процессора' },
  { key: 'airflow', title: 'Airflow king', subtitle: 'Лучший поток воздуха' },
  { key: 'balanced', title: 'Лучший баланс', subtitle: 'Шум + охлаждение + airflow' },
  { key: 'value', title: 'Бюджетный выбор', subtitle: 'Эффективность за цену' },
]

export const RankingsPanel = ({ rankings }: RankingsPanelProps) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
    <h2 className="text-base font-semibold text-slate-100">Ключевые рейтинги</h2>
    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {labels.map(({ key, title, subtitle }) => (
        <article
          key={key}
          className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 shadow-[0_0_24px_rgba(14,165,233,0.08)]"
        >
          <p className="text-xs uppercase tracking-wide text-cyan-300">{title}</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{rankings[key] ?? 'Нет данных'}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </article>
      ))}
    </div>
  </section>
)
