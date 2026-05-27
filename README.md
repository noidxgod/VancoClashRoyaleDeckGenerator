# PC Fan Benchmark Explorer

Веб-приложение для анализа и сравнения вентиляторов на основе двух наборов тестов:
- CPU тесты
- Анемометр тесты

Интерфейс: один режим `/showcase` (visual dark-tech).

## Что реализовано

- Загрузка данных из:
  - локальных CSV (`/public/data/cpu-tests.csv`, `/public/data/anemometer-tests.csv`)
  - public Google Sheets CSV URL
  - demo fallback (если загрузка не удалась)
- Нормализация и объединение таблиц по модели вентилятора
- `normalizeFanName()` + fuzzy matching для похожих названий
- Диагностика merge:
  - unmatched CPU
  - unmatched anemometer
  - possible fuzzy matches
- Метрики и рейтинги:
  - performanceScore
  - silenceScore
  - airflowScore
  - cpuCoolingScore
  - balancedScore
  - valueScore (если есть цена)
  - efficiencyPerNoise
  - airflowPerNoise
- Фильтры, сортировки, fuzzy поиск
- Карточка вентилятора с радаром и raw-row деталями
- Сравнение 2–4 моделей (таблица + графики)
- Экспорт объединённых данных в JSON/CSV
- Строгий режим изображений: отдельный `.png` файл под каждую модель

## Формулы scoring

Внутри текущего набора данных все ключевые метрики нормализуются в диапазон `0..100`.

- Для температуры и шума: меньше = лучше
- Для airflow: больше = лучше

Счёт:
- `cpuCoolingScore` = нормализованная обратная температура CPU
- `airflowScore` = нормализованный airflow
- `silenceScore` = нормализованный обратный шум
- `performanceScore` = `0.45 * cpuCoolingScore + 0.35 * airflowScore + 0.20 * silenceScore`
- `balancedScore` = `0.40 * cpuCoolingScore + 0.30 * airflowScore + 0.30 * silenceScore`
- `valueScore` = нормализованный `performanceScore / price`
- `efficiencyPerNoise` = `performanceScore / noise`
- `airflowPerNoise` = `airflow / noise`

## Структура проекта

```txt
/src
  /charts
  /components
  /data
  /pages
  /types
  /utils
  /visuals

/public
  /data
    cpu-tests.csv
    anemometer-tests.csv
    example-cpu-tests.csv
    example-anemometer-tests.csv
  /fans
    <normalized-model>.png
```

## Зависимости

- Node.js 20+
- npm 10+

## Установка

```bash
npm install
```

## Локальный запуск

```bash
npm run dev
```

Открывайте:
- [http://localhost:5173/showcase](http://localhost:5173/showcase)

## Production build

```bash
npm run build
npm run preview
```

## Куда положить CSV

1. CPU CSV: `public/data/cpu-tests.csv`
2. Anemometer CSV: `public/data/anemometer-tests.csv`

## Как экспортировать Google Sheets в CSV

### Вариант A: через UI Google Sheets

1. Откройте таблицу
2. `Файл -> Скачать -> Значения, разделённые запятыми (.csv)`
3. Сохраните как:
   - `cpu-tests.csv`
   - `anemometer-tests.csv`
4. Положите в `public/data/`

### Вариант B: public CSV URL

Для листа с `gid=0`:

```txt
https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/export?format=csv&gid=0
```

В приложении (блок "Источники данных"):
- вставьте URL для CPU и anemometer
- включите "Сначала пробовать public URL"
- нажмите "Применить и обновить"

## Как подключить public CSV URL из Google Sheets

1. Убедитесь, что таблица доступна для чтения (публичная или по ссылке)
2. Введите URLs в блоке "Источники данных"
3. Нажмите "Применить и обновить"
4. Проверьте `Режим источника` в верхней панели:
   - `public-url`
   - `mixed`
   - `local-csv`
   - `demo`

## Как добавить изображения вентиляторов

В `showcase` включен строгий режим изображений:
- для каждой модели обязательно нужен отдельный файл `<normalized-model>.png` в `/public/fans/`
- если файл отсутствует, карточка покажет ошибку с нужным именем файла
- текущий набор изображений уже сгенерирован автоматически для всех моделей в CSV

Пример:
- модель: `Noctua NF-A12x25 G2`
- файл: `public/fans/noctua-nf-a12x25-g2.png`

## Как добавить реальные изображения (обязательно)

1. Откройте `/showcase`
2. В блоке **«Требуемые изображения моделей»** скопируйте список имен файлов
3. Подготовьте реальные картинки и назовите строго по этому списку
4. Положите файлы в `public/fans/`
5. Обновите страницу

При обновлении CSV можно автоматически пересоздать изображения:

```bash
npm run generate:fan-images
```

## Проверка корректного объединения данных

На странице `/showcase` проверьте:
- корректность значений в `Full Benchmark Table`
- наличие изображений у всех карточек (без ошибок «Изображение не найдено»)

## Troubleshooting

### CSV не загружается

- Проверьте путь (`/data/cpu-tests.csv`, `/data/anemometer-tests.csv`)
- Проверьте заголовки CSV
- Смотрите блок "Диагностика загрузки"

### Данные не совпали по названию вентилятора

- Проверьте, что названия моделей близки по написанию
- Учитывайте суффиксы (`rpm`, `об.`)
- Посмотрите `Possible fuzzy matches` в diagnostics

### Графики пустые

- Возможно, после фильтров не осталось строк
- Проверьте test scope/filter ranges
- Проверьте, что нужные столбцы действительно есть в CSV

### Изображения не отображаются

- Проверьте путь и имя файла в `public/fans/`
- В текущем режиме поддерживается только формат `.png`
- Имя файла должно точно совпадать со списком в блоке «Требуемые изображения моделей»

### Google Sheets не отдает данные

- Проверьте доступность таблицы по ссылке
- Проверьте формат URL `.../export?format=csv&gid=...`
- Включите fallback на local CSV

### Сайт показывает demo data

- Значит, хотя бы один источник не загрузился
- Смотрите предупреждения в "Диагностика загрузки"
- Исправьте путь/URL и нажмите "Применить и обновить"

## Полезные команды

```bash
npm install
npm run dev
npm run build
npm run preview
npm run generate:fan-images
```
