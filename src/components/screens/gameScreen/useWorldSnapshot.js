// src/components/screens/gameScreen/useWorldSnapshot.js
//
// Единый источник правды для worldOffset:
// - worldOffsetRef.current  -> float (логика)
// - worldOffsetPxRef.current -> int (pixel-perfect рендер)
//
// Все слои должны читать одно и то же, чтобы ничего не "плыло".

import { useEffect, useMemo, useRef } from "react";

export function useWorldSnapshot(status, runId, scrollSpeedRef) {
  const worldOffsetRef = useRef(0);      // float
  const worldOffsetPxRef = useRef(0);    // int (rounded)

  useEffect(() => {
    worldOffsetRef.current = 0;
    worldOffsetPxRef.current = 0;
  }, [runId]);

  useEffect(() => {
    if (status !== "running") return;

    let raf = 0;
    let last = performance.now();

    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;

      const speed = scrollSpeedRef?.current ?? 0;
      const next = worldOffsetRef.current + speed * dt;

      worldOffsetRef.current = next;
      worldOffsetPxRef.current = Math.round(next);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, scrollSpeedRef]);

  return useMemo(
    () => ({
      worldOffsetRef,
      worldOffsetPxRef,
    }),
    []
  );
}
