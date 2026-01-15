import { ROADSIDE_DECOR } from "./roadsideDecor.config";

export default function DecorSprite({ type, xPercent, yPx, scale }) {
  const decor = ROADSIDE_DECOR.TYPES[type];

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
        width: `calc(${decor.w * usedScale}px * var(--decor-render-scale, 1))`,
        height: `calc(${decor.h * usedScale}px * var(--decor-render-scale, 1))`,
        transform: "translateX(-50%)",
        imageRendering: "pixelated",
        zIndex: decor.z,
      }}
    />
  );
}
