import sheet from "../../assets/sprites/cats/cats_sheet.png";
import { useEffect, useState, useMemo } from "react";

import { CAT_ROW_BY_ID, CAT_SHEET, CAT_ANIM } from "../../config/catSprite";
import { PLAYER_RENDER } from "../../config/playerRender";

export default function CatSprite({ catId, actionState = "run", jumpPhase = null }) {
  const frameW = CAT_SHEET.FRAME_W;
  const frameH = CAT_SHEET.FRAME_H;

  const scale = CAT_SHEET.SCALE_OPTIONS[0]; // 2

  const rowIndex = CAT_ROW_BY_ID[catId] ?? 0;

  const anim = useMemo(() => {
    return CAT_ANIM[actionState] ?? CAT_ANIM.run;
  }, [actionState]);

  const [sheetSize, setSheetSize] = useState({ w: 0, h: 0 });
  const [localFrame, setLocalFrame] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.src = sheet;
    img.onload = () => setSheetSize({ w: img.width, h: img.height });
  }, []);

  // run крутится, jump/slide проигрываются 1 раз (но для jump кадр задаём фазой)
  useEffect(() => {
    setLocalFrame(0);

    const isLooping = actionState === "run";
    const intervalMs = Math.round(1000 / anim.fps);

    const id = setInterval(() => {
      setLocalFrame((prev) => {
        if (isLooping) return (prev + 1) % anim.frames;
        return Math.min(prev + 1, anim.frames - 1);
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [actionState, anim.fps, anim.frames]);

  if (sheetSize.w === 0 || sheetSize.h === 0) return null;

  let sheetFrameIndex = anim.start + localFrame;

  // ✅ Прыжок: кадр зависит от фазы полёта
  if (actionState === "jump") {
    if (jumpPhase === "up") sheetFrameIndex = anim.start + 0; // кадр 4
    else if (jumpPhase === "apex") sheetFrameIndex = anim.start + 1; // кадр 5
    else if (jumpPhase === "down") sheetFrameIndex = anim.start + 2; // кадр 6
    else sheetFrameIndex = anim.start + localFrame;
  }

  const frameX = sheetFrameIndex * frameW;
  const frameY = rowIndex * frameH;

  const isSlide = actionState === "slide";
  const renderH = isSlide ? Math.round(frameH * 0.7) : frameH;

  const spriteOffsetY =
    PLAYER_RENDER.SPRITE_OFFSET_Y_PX[actionState] ??
    PLAYER_RENDER.SPRITE_OFFSET_Y_PX.run ??
    0;

  return (
    <div
      className="pixelated"
      style={{
        width: frameW * scale,
        height: renderH * scale,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `translateY(${spriteOffsetY}px)`,
          willChange: "transform",

          backgroundImage: `url(${sheet})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${sheetSize.w * scale}px ${sheetSize.h * scale}px`,
          backgroundPosition: `${-frameX * scale}px ${-frameY * scale}px`,

          width: frameW * scale,
          height: frameH * scale,
        }}
      />
    </div>
  );
}
