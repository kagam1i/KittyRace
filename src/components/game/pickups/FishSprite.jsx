/**
 * FishSprite
 * - позиционирование (x / y)
 * - масштаб
 * - pop при подборе
 * - fade-out при culled (если sidestep "поймал" рыбу уже в кадре)
 *
 * ⚠️ Важно: transform лучше разделять:
 * - внешний div: translate(-50%, -50%) для центрирования
 * - внутренний div: scale + анимации (pop/fade)
 */
export default function FishSprite({
  src,
  x,
  y,
  sizePx,
  scale = 1,
  picked = false,
  culled = false,
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
        transform: "translate(-50%, -50%)",
        zIndex,
      }}
    >
      <div
        className={`w-full h-full ${picked ? "fish-pop" : ""} ${
          culled ? "fish-fade" : ""
        }`}
        style={{ transform: `scale(${scale})` }}
      >
        <img src={src} alt="" className="w-full h-full" draggable={false} />
      </div>
    </div>
  );
}
