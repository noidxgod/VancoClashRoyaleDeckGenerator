export const HowScoringWorks = () => (
  <section className="grid gap-4 lg:grid-cols-2">
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Как считается рейтинг</h3>
      <p className="mt-2 text-sm text-slate-300">
        Все метрики нормализуются по шкале 0–100 внутри текущего набора данных. Для температуры и шума меньше = лучше,
        для airflow больше = лучше.
      </p>
      <ul className="mt-3 space-y-1 text-xs text-slate-400">
        <li>• `cpuCoolingScore`: нормализованная обратная температура CPU.</li>
        <li>• `airflowScore`: нормализованный поток воздуха (анемометр).</li>
        <li>• `silenceScore`: нормализованный обратный шум.</li>
        <li>• `performanceScore`: 45% CPU + 35% airflow + 20% silence.</li>
        <li>• `balancedScore`: 40% CPU + 30% airflow + 30% silence.</li>
        <li>• `valueScore`: нормализованный performance/price (если цена есть).</li>
      </ul>
    </article>

    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Как читать результаты</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-300">
        <li>• Для тихой сборки: высокий `silenceScore`, низкий шум, стабильный `balancedScore`.</li>
        <li>• Для максимального охлаждения: смотрите `cpuCoolingScore`, температуру CPU и airflow.</li>
        <li>• Для корпуса: важнее airflow и низкий шум на средних оборотах.</li>
        <li>• Для радиатора/CPU кулера: важны температура CPU и статическое давление (если есть).</li>
        <li>• “Спорный результат” означает перекос: например отличная продувка, но высокий шум.</li>
      </ul>
    </article>
  </section>
)
