import { Outlet } from 'react-router-dom'
import { useFanData } from '../data/FanDataContext'

export const AppShell = () => {
  const { dataset } = useFanData()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,184,255,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.09),transparent_40%)]" />

      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="font-['Orbitron'] text-lg tracking-[0.25em] text-cyan-300">FAN BENCH LAB</p>
            <p className="text-xs text-slate-400">CPU + anemometer benchmark explorer</p>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-sm font-medium text-cyan-200 ring-1 ring-cyan-500/25">
            Showcase
          </div>

          <div className="hidden text-right text-xs text-slate-400 sm:block">
            <p>{dataset ? `${dataset.fans.length} моделей` : 'Загрузка данных…'}</p>
            <p>{dataset ? `Режим источника: ${dataset.meta.sourceMode}` : ' '}</p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
