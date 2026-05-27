import type { FanFilters, SortMode } from '../types/fan'

interface FilterPanelProps {
  brands: string[]
  sizes: number[]
  filters: FanFilters
  onFiltersChange: (next: FanFilters) => void
  sortMode: SortMode
  onSortModeChange: (mode: SortMode) => void
  searchText: string
  onSearchTextChange: (value: string) => void
}

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: 'overall', label: 'Итоговый рейтинг' },
  { value: 'cpuTemp', label: 'Лучшая температура CPU' },
  { value: 'airflow', label: 'Максимальный airflow' },
  { value: 'noise', label: 'Минимальный шум' },
  { value: 'balance', label: 'Баланс temp/noise' },
  { value: 'value', label: 'Цена/эффективность' },
  { value: 'rpm', label: 'RPM' },
  { value: 'size', label: 'Размер' },
  { value: 'brand', label: 'Бренд' },
]

const updateRange = (
  value: string,
  current: { min: number | null; max: number | null },
  key: 'min' | 'max',
): { min: number | null; max: number | null } => {
  const parsed = value.trim() === '' ? null : Number(value)
  if (parsed !== null && Number.isNaN(parsed)) {
    return current
  }

  return {
    ...current,
    [key]: parsed,
  }
}

export const FilterPanel = ({
  brands,
  sizes,
  filters,
  onFiltersChange,
  sortMode,
  onSortModeChange,
  searchText,
  onSearchTextChange,
}: FilterPanelProps) => {
  const toggleBrand = (brand: string): void => {
    onFiltersChange({
      ...filters,
      brands: filters.brands.includes(brand)
        ? filters.brands.filter((item) => item !== brand)
        : [...filters.brands, brand],
    })
  }

  const toggleSize = (size: number): void => {
    onFiltersChange({
      ...filters,
      sizes: filters.sizes.includes(size)
        ? filters.sizes.filter((item) => item !== size)
        : [...filters.sizes, size],
    })
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="grid gap-4 xl:grid-cols-5">
        <label className="space-y-1 xl:col-span-2">
          <span className="text-xs text-slate-300">Поиск модели (fuzzy, без учета регистра)</span>
          <input
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm ring-cyan-500/50 outline-none focus:ring"
            placeholder="Например: noctua, p12, tl-b12"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-slate-300">Сортировка</span>
          <select
            value={sortMode}
            onChange={(event) => onSortModeChange(event.target.value as SortMode)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm ring-cyan-500/50 outline-none focus:ring"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-slate-300">Тип теста</span>
          <select
            value={filters.testPresence}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                testPresence: event.target.value as FanFilters['testPresence'],
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm ring-cyan-500/50 outline-none focus:ring"
          >
            <option value="all">Все</option>
            <option value="cpu">Только CPU</option>
            <option value="anemometer">Только анемометр</option>
            <option value="both">Обе таблицы</option>
          </select>
        </label>

        <label className="mt-6 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={filters.onlyBothSources}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                onlyBothSources: event.target.checked,
              })
            }
            className="h-4 w-4 accent-cyan-400"
          />
          Только модели из обеих таблиц
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs text-slate-400">Бренд</p>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  filters.brands.includes(brand)
                    ? 'bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-500/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-slate-400">Размер (мм)</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  filters.sizes.includes(size)
                    ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {size} мм
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <label className="space-y-1 text-xs text-slate-300">
            RPM min/max
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                value={filters.rpmRange.min ?? ''}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    rpmRange: updateRange(event.target.value, filters.rpmRange, 'min'),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm"
                placeholder="min"
              />
              <input
                inputMode="numeric"
                value={filters.rpmRange.max ?? ''}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    rpmRange: updateRange(event.target.value, filters.rpmRange, 'max'),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm"
                placeholder="max"
              />
            </div>
          </label>

          <label className="space-y-1 text-xs text-slate-300">
            Шум, дБ min/max
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                value={filters.noiseRange.min ?? ''}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    noiseRange: updateRange(event.target.value, filters.noiseRange, 'min'),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm"
                placeholder="min"
              />
              <input
                inputMode="numeric"
                value={filters.noiseRange.max ?? ''}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    noiseRange: updateRange(event.target.value, filters.noiseRange, 'max'),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm"
                placeholder="max"
              />
            </div>
          </label>

          <label className="space-y-1 text-xs text-slate-300">
            Цена, ₽ min/max
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                value={filters.priceRange.min ?? ''}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    priceRange: updateRange(event.target.value, filters.priceRange, 'min'),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm"
                placeholder="min"
              />
              <input
                inputMode="numeric"
                value={filters.priceRange.max ?? ''}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    priceRange: updateRange(event.target.value, filters.priceRange, 'max'),
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm"
                placeholder="max"
              />
            </div>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onFiltersChange({
            brands: [],
            sizes: [],
            rpmRange: { min: null, max: null },
            noiseRange: { min: null, max: null },
            priceRange: { min: null, max: null },
            testPresence: 'all',
            onlyBothSources: false,
          })
        }
        className="mt-4 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
      >
        Сбросить фильтры
      </button>
    </section>
  )
}
