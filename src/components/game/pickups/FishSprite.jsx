/**
 * FishSprite
 * - позиционирование (x / y)
 * - масштаб
 * - pop при подборе (длительность задаётся снаружи)
 * - fade-out при culled
 */
export default function FishSprite({
  src,
  x,
  y,
  sizePx,
  scale = 1,
  picked = false,
  culled = false,
  popDurationMs = 180,
  zIndex = 7,
}) {
  return (
    <div
      className="absolute pointer-events-none pixelated"
      style={{
        left: x,
        top: y,
        width: sizePx,
        height: sizePx,
        transform: "translate(-50%, -50%) scale(var(--fish-render-scale, 1))",
        zIndex,
      }}
    >
      <div
        className={`w-full h-full ${picked ? "fish-pop" : ""} ${
          culled ? "fish-fade" : ""
        }`}
        style={{
          transform: `scale(${scale})`,
          animationDuration: picked ? `${popDurationMs}ms` : undefined,
        }}
      >
        <img src={src} alt="" className="w-full h-full" draggable={false} />
      </div>
    </div>
  );
}
