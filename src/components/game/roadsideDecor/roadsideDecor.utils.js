// src/components/game/roadsideDecor/roadsideDecor.utils.js
//
// Только "чистые" утилиты: выбор типа, spacing, clamp/rand, makeItem.
// Никакого React, никаких refs — чтобы поведение было стабильным и тестируемым.

export function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function pickSmallType(ROADSIDE_DECOR) {
  const list = ROADSIDE_DECOR.SMALL_WEIGHTS;
  const sum = list.reduce((a, x) => a + x.weight, 0);
  const r = Math.random() * sum;

  let acc = 0;
  for (const it of list) {
    acc += it.weight;
    if (r <= acc) return it.type;
  }
  return "grass";
}

export function pickTreeVariant(ROADSIDE_DECOR) {
  const v = ROADSIDE_DECOR.TREE_VARIANTS;
  return v[Math.floor(Math.random() * v.length)];
}

export function nextGapY(ROADSIDE_DECOR) {
  const base = ROADSIDE_DECOR.GAP_BASE_Y_PX;
  const jitter = ROADSIDE_DECOR.GAP_JITTER_Y_PX;
  const g = base + randBetween(-jitter, jitter);
  return Math.round(clamp(g, base * 0.65, base * 1.35));
}

export function pickCategory() {
  return Math.random() < 0.6 ? "tree" : "small";
}

export function getXPercentForGroup(ROADSIDE_DECOR, group, side) {
  const ranges = ROADSIDE_DECOR.X_BY_TYPE_PERCENT[group];
  const range = ranges?.[side] ?? ranges?.left;
  return randBetween(range.min, range.max);
}

export function makeItem(ROADSIDE_DECOR, { type, y, group, side, xPercent }) {
  return {
    id: makeId(),
    type,
    y,
    xPercent: xPercent ?? getXPercentForGroup(ROADSIDE_DECOR, group, side),
    group,
  };
}

export function canSpawnTreeAtY(ROADSIDE_DECOR, lastTreeY, y) {
  if (lastTreeY == null) return true;
  return lastTreeY - y >= ROADSIDE_DECOR.TREE_RULES.MIN_SPACING_PX;
}

/**
 * Возвращает { type, group, nextLastTreeY }
 * (lastTreeY обновляем только если реально выбрали дерево)
 */
export function pickTypeForSpawnY(ROADSIDE_DECOR, y, lastTreeY) {
  const cat = pickCategory();

  if (cat === "tree") {
    if (
      Math.random() < ROADSIDE_DECOR.TREE_RULES.CHANCE &&
      canSpawnTreeAtY(ROADSIDE_DECOR, lastTreeY, y)
    ) {
      const t = pickTreeVariant(ROADSIDE_DECOR);
      return { type: t, group: "tree", nextLastTreeY: y };
    }
    return { type: pickSmallType(ROADSIDE_DECOR), group: "small", nextLastTreeY: lastTreeY };
  }

  return { type: pickSmallType(ROADSIDE_DECOR), group: "small", nextLastTreeY: lastTreeY };
}
