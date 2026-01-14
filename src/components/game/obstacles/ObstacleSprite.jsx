export default function ObstacleSprite({
  src,
  x,
  y,
  sizePx,
  scale,
}) {
  const w = sizePx * scale;
  const h = sizePx * scale;

  return (
    <img
      src={src}
      alt=""
      loading="eager"
      decoding="async"
      draggable="false"
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        imageRendering: "pixelated",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}
