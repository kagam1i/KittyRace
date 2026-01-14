export default function ObstacleSprite({ src, x, y, sizePx, scale = 1, typeId }) {
  const isSlide = typeId === "slide" || src?.includes("slide");

  return (
    <div
      className="absolute pointer-events-none pixelated"
      style={{
        left: x,
        top: y,
        width: sizePx,
        height: sizePx,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="w-full h-full"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <img src={src} alt="" className="w-full h-full" draggable={false} />
      </div>
    </div>
  );
}
