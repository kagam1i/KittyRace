# Kitty Race — ARCHITECTURE

Данный документ описывает **архитектуру проекта Kitty Race** в сжатом, схемном виде.
Он дополняет файл `PROJECT_DOCUMENTATION.md` и предназначен для быстрого понимания структуры проекта.

---

## 1. Архитектурный обзор

Kitty Race — браузерная игра в жанре **runner** с камерой **top-down / 3⁄4**, реализованная на React.

Ключевой принцип архитектуры:
> Игровая логика стабильна, визуал и UI — адаптируемы.

---

## 2. Подсистемы проекта

```
UI (Screens, HUD)
        ↓
Game World (Sprites, Layers)
        ↓
Spawn Rules / Configs / Input
        ↓
Redux Store (game / settings)
        ↓
Audio Manager
```

---

## 3. Потоки данных

### Управление
User Input → useGameControls → Redux → PlayerActor / Layers

### Движение мира
World Speed → World Snapshot → Layers → Render

### События
Collisions / Pickups → Redux → UI + Audio

---

## 4. Слои ответственности

| Слой | Назначение |
|-----|-----------|
| UI | Экраны и HUD |
| World | Визуал мира |
| Rules | Генерация |
| State | Redux |
| Config | Параметры |
| Audio | Звук |

---

## 5. Адаптив

- Desktop: оригинальный визуал
- Tablet/Mobile: render-only scale
- CSS-переменные, без изменения логики

---

## 6. Расширяемость

Безопасно добавляются:
- новые препятствия;
- коты;
- визуальные элементы.

При строгом разделении ответственности.

---

## 7. Связанные документы

- PROJECT_DOCUMENTATION.md
- FILES_MAP.md
- EXTENSION_CHECKLIST.md
- kitty_race_architecture.png

---

## Итог

ARCHITECTURE.md — схема и ориентир проекта.
