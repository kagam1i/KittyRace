import { useEffect, useRef } from "react";

import roadTileImg from "../../assets/environment/road_tile.png";
import {
  ROAD_SCROLL_SPEED_PX_PER_SEC,
  ROAD_TILE_SOURCE_PX,
} from "../../config/trackRoad";

/**
 * TrackRoad:
 * берёт тайл дороги road_tile.png
 * повторяет его по вертикали (repeat-y)
 * двигает background-position, создавая бесконечный скролл
 */
export function TrackRoad({ fieldPx }) {
  const layerRef = useRef(null);

  // Высота одного тайла на экране (px),
  // считаем через пропорцию исходного изображения
  const tileHeightPx = Math.round(
    fieldPx *
      (ROAD_TILE_SOURCE_PX.height / ROAD_TILE_SOURCE_PX.width)
  );

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    let raf = 0;
    let last = performance.now();
    let offset = 0;

    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;

      offset += ROAD_SCROLL_SPEED_PX_PER_SEC * dt;

      // Зацикливание смещения по высоте тайла
      const looped =
        tileHeightPx > 0 ? offset % tileHeightPx : 0;

      // трасса визуально едет вниз → фон тоже смещается вниз
      el.style.backgroundPosition = `center ${looped}px`;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tileHeightPx]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
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
