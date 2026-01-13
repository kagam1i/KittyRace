// src/components/game/obstacles/obstacles.spawnRules.js
//
// Только правила спавна (чистая логика), без React.
// Все зависимости прокидываются аргументами.

export function getFishListSafe(getFish) {
  const list = typeof getFish === "function" ? getFish() : [];
  return Array.isArray(list) ? list : [];
}

/**
 * Проверка конфликта с рыбой для avoidLane (sidestep):
 * Возвращает true, если в этой же lane есть рыба "рядом" по Y.
 */
export function fishConflict({
  lane,
  yWorld,
  getOffsetPx,
  getFish,
  rangePx = 420,
}) {
  const offsetPx = typeof getOffsetPx === "function" ? getOffsetPx() : 0;
  const screenY = yWorld + offsetPx;

  const fishList = getFishListSafe(getFish);

  return fishList.some((f) => {
    if (!f) return false;
    const fLane = f.lane ?? f.laneIndex;
    const fY = f.y;

    return (
      !f.picked &&
      !f.hidden &&
      fLane === lane &&
      typeof fY === "number" &&
      Math.abs(fY - screenY) < rangePx
    );
  });
}

export function laneHasEnoughGap({ obstacles, lane, yWorld, minGapPx }) {
  return !obstacles.some((o) => o.lane === lane && Math.abs(o.y - yWorld) < minGapPx);
}

export function laneHasEnoughActionSwitchGap({
  obstacles,
  lane,
  yWorld,
  type,
  actionSwitchMinGapPx,
}) {
  if (type.rule !== "needAction") return true;

  const next = obstacles.find((o) => o.lane === lane && o.y > yWorld);
  if (!next || next.rule !== "needAction") return true;
  if (next.needAction === type.needAction) return true;

  return next.y - yWorld >= actionSwitchMinGapPx;
}
