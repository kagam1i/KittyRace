// Один источник правды для скорости "мира" (прокрутки трассы).
import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  ROAD_SCROLL_SPEED_PX_PER_SEC,
  WORLD_SPEED_RAMP_INTERVAL_SEC,
  WORLD_SPEED_RAMP_MULT,
  WORLD_SCROLL_SPEED_MAX_PX_PER_SEC,
} from "../../../config/trackRoad";


export function useWorldScrollSpeed(_status, runId) {
  const speedRef = useRef(ROAD_SCROLL_SPEED_PX_PER_SEC);
  const rampTimerRef = useRef(0);

  useEffect(() => {
    speedRef.current = ROAD_SCROLL_SPEED_PX_PER_SEC;
    rampTimerRef.current = 0;
  }, [runId]);

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
