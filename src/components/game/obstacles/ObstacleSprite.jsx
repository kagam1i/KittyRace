export default function ObstacleSprite({
  src,
  x,
  y,
  sizePx,
  scale,
  typeId, // ✅ новый проп, опциональный
}) {
  const w = sizePx * scale;
  const h = sizePx * scale;

  const isSlide = typeId === "slide" || src?.includes("slide");
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
    zIndex: isSlide ? 9 : 6,
  }}
/>


  );
}
