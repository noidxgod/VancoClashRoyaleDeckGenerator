# YouTube-чат без backend

Вариант `v4.26` читает live-чат прямо из браузера через YouTube Data API.

## Что нужно

- GitHub Pages.
- YouTube Data API key.
- Активный live-стрим с включённым чатом.

## Ограничения API-ключа

В Google Cloud Console у ключа должны быть ограничения:

```text
Application restrictions: Websites
Website restrictions:
https://noidxgod.github.io/*
https://noidxgod.github.io/VancoClashRoyaleDeckGenerator/*
http://127.0.0.1:8765/*
http://localhost:8765/*

API restrictions:
YouTube Data API v3
```

Ключ в этом режиме публичный, потому что он используется прямо из `index.html`.

## Как проверить

1. Открой тестовую версию сайта.
2. Вставь ссылку на активный live-стрим YouTube.
3. Нажми `Подключить`.
4. В блоке `Сообщения чата` должны появляться обычные сообщения.
5. В блоке `Найденные команды` появятся команды вроде `!колода`.

## Поддерживаемые команды

```text
!колода / !deck / !рандом
!хаос / !chaos
!замена / !replace / !реролл
!карта <название карты>
!бан <название карты>
!голос <номер>
!наказание
```
