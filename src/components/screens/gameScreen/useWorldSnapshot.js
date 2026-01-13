// src/components/screens/gameScreen/useWorldSnapshot.js
//
// Единый источник правды для worldOffset:
// - worldOffsetRef.current  -> float (логика)
// - worldOffsetPxRef.current -> int (pixel-perfect рендер)
//
// Все слои должны читать одно и то же, чтобы ничего не "плыло".

import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Единый rAF для мира.
 *
 * - worldOffsetRef.current    -> float (логика)
 * - worldOffsetPxRef.current  -> int   (pixel-perfect рендер)
 * - subscribe(fn) позволяет слоям подписаться на каждый тик,
 *   не создавая свои rAF (слои становятся "тупыми").
 */
export function useWorldSnapshot(status, runId, scrollSpeedRef, onTick) {
  const worldOffsetRef = useRef(0); // float
  const worldOffsetPxRef = useRef(0); // int (rounded)

  const listenersRef = useRef(new Set());

  const subscribe = useCallback((fn) => {
    if (typeof fn !== "function") return () => {};
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    worldOffsetRef.current = 0;
    worldOffsetPxRef.current = 0;
  }, [runId]);

  useEffect(() => {
    if (status !== "running") return;

    let raf = 0;
    let last = performance.now();

    const tick = (ts) => {
      // dt clamp: защищает от огромного шага после возврата вкладки.
      const rawDt = (ts - last) / 1000;
      const dt = Math.max(0, Math.min(0.05, rawDt));
      last = ts;

      // обновление скорости (ускорение мира) — в том же rAF
      if (typeof onTick === "function") onTick(dt);

      const speed = scrollSpeedRef?.current ?? 0;
      const next = worldOffsetRef.current + speed * dt;

      worldOffsetRef.current = next;
      worldOffsetPxRef.current = Math.round(next);

      if (listenersRef.current.size) {
        for (const fn of listenersRef.current) {
          try {
            fn({
              ts,
              dt,
              worldOffset: worldOffsetRef.current,
              worldOffsetPx: worldOffsetPxRef.current,
              speed,
            });
          } catch (_) {}
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, scrollSpeedRef, onTick]);

  return useMemo(
    () => ({
      worldOffsetRef,
      worldOffsetPxRef,
      subscribe,
    }),
    [subscribe]
  );
}
