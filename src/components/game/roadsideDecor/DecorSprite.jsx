// ------------------------------------------------
// "Глупый" визуальный компонент.
// Не знает ни про генерацию, ни про скорость, ни про логику.
// Просто рисует один объект.
//
// ------------------------------------------------

import { ROADSIDE_DECOR } from "./roadsideDecor.config";

export default function DecorSprite({ type, xPercent, yPx, scale }) {
  const decor = ROADSIDE_DECOR.TYPES[type];

  // ✅ по умолчанию оставляем прежнее поведение
  const usedScale = scale ?? ROADSIDE_DECOR.SCALE;

  return (
    <img
      src={decor.src}
      alt=""
      draggable={false}
      className="absolute pointer-events-none select-none"
      style={{
        left: `${xPercent}%`,
        top: `${yPx}px`,
        width: decor.w * usedScale,
        height: decor.h * usedScale,
        transform: "translateX(-50%)",
        imageRendering: "pixelated",
        zIndex: decor.z,
      }}
    />
  );
}
