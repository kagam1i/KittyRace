import { getObstacleBoundsPx } from "../obstacles/obstacleBounds";

export function getObstaclesSafe(getObstacles) {
  const raw = typeof getObstacles === "function" ? getObstacles() : [];
  return Array.isArray(raw) ? raw : [];
}


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

    const sY = o.y; 
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


export function cullInvisibleConflicts({
  fishList,
  offsetFloat,
  topVisibleScreenY,
  isBlockedFn, 
}) {
  let changed = false;

  for (const f of fishList) {
    if (!f || f.hidden || f.picked) continue;

    const fishScreenY = f.y + offsetFloat;

    if (fishScreenY > topVisibleScreenY) continue; 
    if (!isBlockedFn(f.lane, fishScreenY)) continue;

    f.hidden = true;
    changed = true;
  }

  return changed;
}

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
