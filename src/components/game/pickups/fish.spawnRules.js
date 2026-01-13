// src/components/game/pickups/fish.spawnRules.js
//
// Правила спавна/конфликтов рыб.
// Никакого React. Все зависимости прокидываются аргументами.

import { getObstacleBoundsPx } from "../obstacles/obstacleBounds";

export function getObstaclesSafe(getObstacles) {
  const raw = typeof getObstacles === "function" ? getObstacles() : [];
  return Array.isArray(raw) ? raw : [];
}

/**
 * Рыба блокируется препятствием sidestep, если пересекается по Y (с зазором).
 * ВАЖНО: obstacles snapshot должен отдавать y = screenY.
 */
export function fishBlockedBySidestep({
  fishLane,
  fishScreenY,
  getObstacles,
  laneW,
  fishSizePx,
  sidestepLaneRadius,
  sidestepGapPx,
}) {
  const fishHalf = fishSizePx / 2;

  const fishTop = fishScreenY - fishHalf;
  const fishBot = fishScreenY + fishHalf;

  for (const o of getObstaclesSafe(getObstacles)) {
    if (!o || o.typeId !== "sidestep") continue;

    const obsLane = o.lane ?? 0;
    if (Math.abs(fishLane - obsLane) > sidestepLaneRadius) continue;

    const sY = o.y; // screenY
    if (typeof sY !== "number") continue;

    const b = getObstacleBoundsPx({
      typeId: o.typeId,
      laneW,
      yPx: sY,
    });

    const top = Math.round(b.top) - sidestepGapPx;
    const bottom = Math.round(b.bottom) + sidestepGapPx;

    if (fishBot > top && fishTop < bottom) return true;
  }

  return false;
}

/**
 * Мягкая страховка: если рыба ещё выше экрана и конфликтует с sidestep — прячем.
 */
export function cullInvisibleConflicts({
  fishList,
  offsetFloat,
  topVisibleScreenY,
  isBlockedFn, // (lane, screenY) => boolean
}) {
  let changed = false;

  for (const f of fishList) {
    if (!f || f.hidden || f.picked) continue;

    const fishScreenY = f.y + offsetFloat;

    if (fishScreenY > topVisibleScreenY) continue; // в кадре/почти в кадре — не трогаем
    if (!isBlockedFn(f.lane, fishScreenY)) continue;

    f.hidden = true;
    changed = true;
  }

  return changed;
}

/**
 * Проверка: нет ли слишком близкой рыбы в той же lane (в world-Y).
 * Учитываем размер рыбы и "видимость" во время pop-анимации.
 */
export function hasTooCloseFishSameLane({
  fishList,
  lane,
  yWorld,
  nowMs,
  minLaneGapPx,
  fishSizePx,
  popBaseMs,
}) {
  const minGap = Math.max(minLaneGapPx, Math.round(fishSizePx * 0.9));

  for (const f of fishList) {
    if (!f || f.hidden) continue;

    const stillVisible = !f.picked || (nowMs - f.pickedAtMs < (f.popDurationMs ?? popBaseMs));
    if (!stillVisible) continue;

    if (f.lane !== lane) continue;
    if (Math.abs(f.y - yWorld) < minGap) return true;
  }

  return false;
}
