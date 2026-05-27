export const LoadingState = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-r-transparent" />
    <p className="text-slate-200">Загружаем данные тестов вентиляторов…</p>
  </div>
)

export const ErrorState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-rose-700/60 bg-rose-900/20 p-6 text-rose-100">
    <p className="font-semibold">Ошибка загрузки данных</p>
    <p className="mt-2 text-sm text-rose-200/90">{message}</p>
  </div>
)

export const EmptyState = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
    <p className="text-slate-200">Нет данных для отображения. Проверьте фильтры или источники CSV.</p>
  </div>
)
