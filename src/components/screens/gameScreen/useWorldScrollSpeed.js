// src/components/screens/gameScreen/useWorldScrollSpeed.js
//
// Один источник правды для скорости "мира" (прокрутки трассы).
//
// Почему это отдельный хук:
// - Все слои (дорога, обочины, декор, препятствия, рыбы) должны читать одну и ту же
//   скорость, иначе визуально они начнут "плыть" друг относительно друга.
// - Мы не храним скорость в Redux, потому что она обновляется часто, а Redux
//   будет вызывать лишние ререндеры. Для этой задачи идеален useRef.
// - Ускорение делаем редким и небольшим, чтобы не было дёрганий и не ломался геймплей.

import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  ROAD_SCROLL_SPEED_PX_PER_SEC,
  WORLD_SPEED_RAMP_INTERVAL_SEC,
  WORLD_SPEED_RAMP_MULT,
  WORLD_SCROLL_SPEED_MAX_PX_PER_SEC,
} from "../../../config/trackRoad";

/**
 * Возвращает ref на текущую скорость прокрутки (px/sec).
 *
 * - При новом забеге (runId) скорость сбрасывается к базовой.
 * - Скорость обновляется ТОЛЬКО из ЕДИНОГО rAF (useWorldSnapshot).
 * - На паузе рост останавливается, но текущая скорость сохраняется.
 */
export function useWorldScrollSpeed(_status, runId) {
  const speedRef = useRef(ROAD_SCROLL_SPEED_PX_PER_SEC);
  const rampTimerRef = useRef(0);

  useEffect(() => {
    speedRef.current = ROAD_SCROLL_SPEED_PX_PER_SEC;
    rampTimerRef.current = 0;
  }, [runId]);

  // ✅ Обновление скорости вызывается из ЕДИНОГО rAF (useWorldSnapshot)
  const updateSpeed = useCallback((dtSec) => {
    const dt = typeof dtSec === "number" && dtSec > 0 ? dtSec : 0;
    if (dt === 0) return;

    rampTimerRef.current += dt;
    const interval = WORLD_SPEED_RAMP_INTERVAL_SEC;

    if (interval > 0 && rampTimerRef.current >= interval) {
      const steps = Math.floor(rampTimerRef.current / interval);
      rampTimerRef.current -= steps * interval;

      let v = speedRef.current;
      for (let i = 0; i < steps; i++) v *= WORLD_SPEED_RAMP_MULT;
      speedRef.current = Math.min(WORLD_SCROLL_SPEED_MAX_PX_PER_SEC, v);
    }
  }, []);

  return useMemo(
    () => ({
      scrollSpeedRef: speedRef,
      updateSpeed,
    }),
    [updateSpeed]
  );
}
