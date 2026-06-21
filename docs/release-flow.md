# Релизы, тестовая ветка и откаты

## Ветки

```text
main     = рабочий сайт GitHub Pages
staging  = тестовая версия
```

Новые функции сначала коммитятся и пушатся в `staging`.

Когда тестовая версия проверена, её можно перенести в production:

```bash
git switch main
git merge staging
git push origin main
```

## Теги версий

Каждая важная версия помечается Git-тегом:

```bash
git tag -a v4.25 -m "v4.25"
git push origin v4.25
```

Посмотреть все версии:

```bash
git tag --list "v*" --sort=-v:refname
```

## Быстрый откат production к прошлой версии

`v5` выпущен одним production-коммитом поверх `v4.23`, поэтому самый удобный откат обратно:

```bash
git switch main
git revert v5 --no-edit
git push origin main
```

Такой откат создаст новый rollback-коммит в `main` и не тронет ветку `staging`.

Например, откатить рабочий сайт к `v4.23`:

```bash
git switch main
git restore --source v4.23 -- .
git commit -m "rollback production to v4.23"
git push origin main
```

Такой откат создаёт обычный коммит и не переписывает историю ветки `main`.

Если нужно отменить только один конкретный коммит, можно сделать revert:

```bash
git switch main
git revert <commit_hash>
git push origin main
```

Аварийный force-rollback тоже возможен, но его лучше делать только вручную и только после отдельного подтверждения.

## Лог изменений

Перед каждым релизом обновляется `CHANGELOG.md`:

```text
## v4.25 — staging

- Что добавлено.
- Что исправлено.
- Что изменено.
```

После выпуска в production пометка `staging` меняется на `production`.
