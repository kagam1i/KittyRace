/**
 * FishSprite
 * Отвечает ТОЛЬКО за визуал рыбки.
 *
 * - позиционирование (x / y)
 * - масштаб
 * - pop-эффект при подборе
 */

export default function FishSprite({
  src,
  x,
  y,
  sizePx,
  scale = 1,
  picked = false,
  zIndex = 7,
}) {
  return (
    <div
      className={`absolute pointer-events-none pixelated ${
        picked ? "fish-pop" : ""
      }`}
      style={{
        left: x,
        top: y,
        width: sizePx,
        height: sizePx,
        transform: "translate(-50%, -50%) scale(" + scale + ")",
        zIndex,
      }}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full"
        draggable={false}
      />
    </div>
  );
}
