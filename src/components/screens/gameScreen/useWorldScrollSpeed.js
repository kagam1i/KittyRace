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

import { useEffect, useRef } from "react";

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
 * - Пока игра в статусе "running" скорость медленно растёт.
 * - На паузе рост останавливается, но текущая скорость сохраняется.
 */
export function useWorldScrollSpeed(status, runId) {
  const speedRef = useRef(ROAD_SCROLL_SPEED_PX_PER_SEC);

  // Сколько времени прошло с последнего "шага" ускорения.
  const rampTimerRef = useRef(0);

  useEffect(() => {
    // Новый забег — начинаем с базовой скорости.
    speedRef.current = ROAD_SCROLL_SPEED_PX_PER_SEC;
    rampTimerRef.current = 0;
  }, [runId]);

  useEffect(() => {
    if (status !== "running") return;

    let raf = 0;
    let lastTs = 0;

    const tick = (ts) => {
      if (!lastTs) lastTs = ts;

      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      // Накапливаем время и при необходимости делаем несколько "шагов" ускорения.
      // Это важно, если вкладка была в фоне или кадры пропускались.
      rampTimerRef.current += dt;
      const interval = WORLD_SPEED_RAMP_INTERVAL_SEC;

      if (interval > 0 && rampTimerRef.current >= interval) {
        const steps = Math.floor(rampTimerRef.current / interval);
        rampTimerRef.current -= steps * interval;

        let v = speedRef.current;
        for (let i = 0; i < steps; i++) v *= WORLD_SPEED_RAMP_MULT;
        speedRef.current = Math.min(WORLD_SCROLL_SPEED_MAX_PX_PER_SEC, v);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  return speedRef;
}
