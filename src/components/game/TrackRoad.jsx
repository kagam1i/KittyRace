import { useEffect, useRef } from "react";

import roadTileImg from "../../assets/environment/road_tile.png";
import { ROAD_TILE_SOURCE_PX } from "../../config/trackRoad";

/**
 * TrackRoad:
 * - рисует тайл дороги
 * - повторяет его по вертикали
 * - двигает background-position, создавая бесконечный скролл
 *
 * Важно:
 * - если передан worldOffsetRef, дорога использует его.
 * - offset округляется до целых пикселей, чтобы не было дрожания pixel-art.
 */
export function TrackRoad({ fieldPx, status, scrollSpeedRef, worldOffsetRef, subscribeWorld }) {
  const layerRef = useRef(null);

  // fallback, если worldOffsetRef не передали
  const localOffsetRef = useRef(0);

  const tileHeightPx = Math.round(
    fieldPx * (ROAD_TILE_SOURCE_PX.height / ROAD_TILE_SOURCE_PX.width)
  );

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    if (status !== "running") return;

    // Если не передали subscribeWorld — fallback на старое поведение (локальный rAF)
    if (typeof subscribeWorld !== "function") {
      let raf = 0;
      let last = performance.now();

      const tick = (ts) => {
        const dt = (ts - last) / 1000;
        last = ts;

        let offset = worldOffsetRef?.current;
        if (typeof offset !== "number") {
          const speed = scrollSpeedRef?.current ?? 0;
          localOffsetRef.current += speed * dt;
          offset = localOffsetRef.current;
        }

        const rounded = Math.round(offset);
        const looped = tileHeightPx > 0 ? rounded % tileHeightPx : 0;
        el.style.backgroundPosition = `center ${looped}px`;

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    const unsubscribe = subscribeWorld(({ worldOffsetPx }) => {
      const looped = tileHeightPx > 0 ? worldOffsetPx % tileHeightPx : 0;
      el.style.backgroundPosition = `center ${looped}px`;
    });

    return unsubscribe;
  }, [tileHeightPx, status, scrollSpeedRef, worldOffsetRef, subscribeWorld]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        ref={layerRef}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${roadTileImg})`,
          backgroundRepeat: "repeat-y",
          backgroundSize: "100% auto",
          backgroundPosition: "center 0px",
          imageRendering: "pixelated",
          willChange: "background-position",
        }}
      />
    </div>
  );
}
