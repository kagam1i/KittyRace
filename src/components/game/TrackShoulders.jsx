import { useEffect, useMemo, useRef } from "react";

import leftImg from "../../assets/environment/left_road.png";
import rightImg from "../../assets/environment/right_road.png";

import {
  SHOULDER_TILE_SOURCE_PX,
  SHOULDER_STRIP_PERCENT,
} from "../../config/trackRoad";

import RoadsideDecorLayer from "./roadsideDecor/RoadsideDecorLayer";

export function TrackShoulder({ fieldPx, side, status, scrollSpeedRef, worldOffsetRef, subscribeWorld }) {
  const layerRef = useRef(null);

  const img = side === "left" ? leftImg : rightImg;

  const shoulderW = useMemo(() => {
    return (fieldPx * SHOULDER_STRIP_PERCENT) / 100;
  }, [fieldPx]);

  const tileHeightPx = Math.round(
    fieldPx * (SHOULDER_TILE_SOURCE_PX.height / SHOULDER_TILE_SOURCE_PX.width)
  );

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    if (status !== "running") return;

    // Единый rAF живёт в useWorldSnapshot. Обочина просто читает общий offset.
    if (typeof subscribeWorld === "function") {
      const unsubscribe = subscribeWorld(({ worldOffsetPx }) => {
        const looped = tileHeightPx > 0 ? worldOffsetPx % tileHeightPx : 0;
        el.style.backgroundPosition = `center ${looped}px`;
      });
      return unsubscribe;
    }

    // fallback
    let raf = 0;
    let last = performance.now();
    let offset = 0;

    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;
      const speed = scrollSpeedRef?.current ?? 0;
      offset += speed * dt;
      const looped = tileHeightPx > 0 ? Math.round(offset) % tileHeightPx : 0;
      el.style.backgroundPosition = `center ${looped}px`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tileHeightPx, status, scrollSpeedRef, subscribeWorld]);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
        ref={layerRef}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${img})`,
          backgroundRepeat: "repeat-y",
          backgroundSize: "100% auto",
          backgroundPosition: "center 0px",
          imageRendering: "pixelated",
          willChange: "background-position",
        }}
      />

      <RoadsideDecorLayer
        side={side}
        scrollSpeedRef={scrollSpeedRef}
        worldOffsetRef={worldOffsetRef}
        status={status}
        shoulderW={shoulderW}
        subscribeWorld={subscribeWorld}
      />
    </div>
  );
}
