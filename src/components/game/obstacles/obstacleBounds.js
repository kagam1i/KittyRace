import { OBSTACLES_CONFIG } from "./obstacles.config";

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

/**
 * Единый источник правды по scale препятствий.
 * Должен совпадать с тем, как ObstacleLayer считает scale.
 */
export function getObstacleScalePx({ laneW }) {
  const s = (laneW * 0.9) / OBSTACLES_CONFIG.BASE_SIZE_PX;
  return clamp(s, 0.85, OBSTACLES_CONFIG.SCALE);
}

/**
 * Bounds в экранных координатах (center-based).
 * yPx — screenY центра препятствия.
 */
export function getObstacleBoundsPx({ typeId, laneW, yPx }) {
  const scale = getObstacleScalePx({ laneW });
  const base = OBSTACLES_CONFIG.BASE_SIZE_PX;

  // критично для рыбы: sidestep
  if (typeId === "sidestep") {
    const h = base * scale;
    return {
      top: yPx - h / 2,
      bottom: yPx + h / 2,
      height: h,
      scale,
    };
  }

  // дефолт (на будущее)
  const h = base * scale;
  return {
    top: yPx - h / 2,
    bottom: yPx + h / 2,
    height: h,
    scale,
  };
}
