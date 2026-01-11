import { useEffect, useMemo, useRef } from "react";

import leftImg from "../../assets/environment/left_road.png";
import rightImg from "../../assets/environment/right_road.png";

import {
  SHOULDER_TILE_SOURCE_PX,
  SHOULDER_STRIP_PERCENT,
} from "../../config/trackRoad";

// слой декораций поверх обочины
import RoadsideDecorLayer from "./roadsideDecor/RoadsideDecorLayer";

/**
 * TrackShoulder:
 * рисует одну обочину (left или right)
 * скроллит её вниз

 *
 *  Адаптив:
 * - на мобильных обочина очень узкая
 * - мы вычисляем shoulderW и прокидываем в декор-слой,
 *   чтобы он мог clamp’ить scale и не вылезать за границы.
 */
export function TrackShoulder({ fieldPx, side, status, scrollSpeedRef }) {
  const layerRef = useRef(null);

  // offset держим в ref, чтобы при паузе обочина не "прыгала" назад.
  const offsetRef = useRef(0);

  const img = side === "left" ? leftImg : rightImg;

  // ширина обочины в px (важно для адаптива декора)
  const shoulderW = useMemo(() => {
    return (fieldPx * SHOULDER_STRIP_PERCENT) / 100;
  }, [fieldPx]);

  // высота тайла по пропорции исходной картинки
  const tileHeightPx = Math.round(
    fieldPx * (SHOULDER_TILE_SOURCE_PX.height / SHOULDER_TILE_SOURCE_PX.width)
  );

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    // На паузе не двигаем фон, чтобы весь мир останавливался.
    if (status !== "running") return;

    let raf = 0;
    let last = performance.now();
    let offset = offsetRef.current;

    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;

      const speed = scrollSpeedRef?.current ?? 0;
      offset += speed * dt;
      const looped = tileHeightPx > 0 ? offset % tileHeightPx : 0;

      offsetRef.current = offset;
      el.style.backgroundPosition = `center ${looped}px`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tileHeightPx, status, scrollSpeedRef]);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* фон обочины */}
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

      {/* декорации поверх обочины */}
      <RoadsideDecorLayer
        side={side}
        scrollSpeedRef={scrollSpeedRef}
        status={status}
        shoulderW={shoulderW}
      />
    </div>
  );
}
