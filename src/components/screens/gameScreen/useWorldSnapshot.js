import { useEffect, useMemo, useRef } from "react";

/**
 * Единый источник правды для движения мира.
 *
 * Возвращает:
 * - worldOffsetRef (float px) — "физика", можно использовать для логики
 * - worldOffsetPxRef (int px) — пиксельная версия (Math.round), ДОЛЖНА использоваться для снапшотов
 *
 * Важно:
 * - offsetPx считается ОДИН раз в кадр и общий для всех слоёв
 * - это убирает рассинхрон, когда один слой округляет, другой нет
 */
export function useWorldSnapshot(status, runId, scrollSpeedRef) {
  const worldOffsetRef = useRef(0);     // float
  const worldOffsetPxRef = useRef(0);   // int (rounded)

  // сброс при новом забеге
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
    () => ({ worldOffsetRef, worldOffsetPxRef }),
    []
  );
}
