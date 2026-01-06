// src/components/game/roadsideDecor/DecorSprite.jsx
// ------------------------------------------------
// "Глупый" визуальный компонент.
// Не знает ни про генерацию, ни про скорость, ни про логику.
// Просто рисует один объект.
// ------------------------------------------------

import { ROADSIDE_DECOR } from "./roadsideDecor.config";

export default function DecorSprite({ type, xPercent, yPx }) {
  const decor = ROADSIDE_DECOR.TYPES[type];

  return (
    <img
      src={decor.src}
      alt=""
      draggable={false}
      className="absolute pointer-events-none select-none"
      style={{
        left: `${xPercent}%`,
        top: `${yPx}px`,
        width: decor.w * ROADSIDE_DECOR.SCALE,
        height: decor.h * ROADSIDE_DECOR.SCALE,
        transform: "translateX(-50%)",
        imageRendering: "pixelated",
        zIndex: decor.z,
      }}
    />
  );
}
