# Бэкенд для YouTube-чата

Этот endpoint читает live-чат YouTube на сервере, чтобы не хранить `YOUTUBE_API_KEY` внутри `index.html`.

Важно: GitHub Pages не запускает Node.js backend. Сам сайт можно оставить на GitHub Pages, а этот endpoint нужно отдельно запустить локально или задеплоить, например, на Vercel.

## Переменные окружения

```bash
YOUTUBE_API_KEY=your_youtube_data_api_key
ALLOWED_ORIGINS=https://noidxgod.github.io,http://127.0.0.1:8765,http://localhost:8765
PORT=8787
```

`ALLOWED_ORIGINS=*` тоже работает, но список конкретных доменов безопаснее.

## Локальный запуск

```bash
cd /Users/rodya/CR
export YOUTUBE_API_KEY="your_youtube_data_api_key"
npm run chat:server
```

Проверка, что backend жив:

```bash
curl "http://127.0.0.1:8787/api/youtube-chat?health=1"
```

Чтение чата по ссылке на стрим:

```bash
curl "http://127.0.0.1:8787/api/youtube-chat?source=https://www.youtube.com/watch?v=VIDEO_ID"
```

Стрим должен идти прямо сейчас, а live-чат должен быть включён.

## Вариант деплоя: Vercel

1. Импортируй GitHub-репозиторий в Vercel.
2. Добавь переменную окружения `YOUTUBE_API_KEY`.
3. Добавь переменную окружения `ALLOWED_ORIGINS=https://noidxgod.github.io`.
4. Нажми Deploy.
5. Вставь URL проекта Vercel в поле `Адрес бэкенда` на сайте.

Если URL проекта Vercel такой:

```text
https://example.vercel.app
```

то endpoint будет:

```text
https://example.vercel.app/api/youtube-chat
```

## Команды чата

```text
!колода / !deck / !рандом
!хаос / !chaos
!замена / !replace / !реролл
!карта <название карты>
!бан <название карты>
!голос <номер>
!наказание
```

Фронтенд сам решает, выполнять команды автоматически или только показывать их в списке.
