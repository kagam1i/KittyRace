import sheet from "../../assets/sprites/cats/cats_sheet.png";
import { useEffect, useState } from "react";
import { CAT_ROW_BY_ID } from "../../config/catSprite";
import {CAT_SHEET} from "../../config/catSprite";

export default function CatSprite({catId}) {
  const frameW = CAT_SHEET.FRAME_W;
  const frameH = CAT_SHEET.FRAME_H;
  const scale = CAT_SHEET.SCALE_OPTIONS[0];

  const frameIndex = 0; // первый кадр в ряду
  const rowIndex = CAT_ROW_BY_ID[catId];

  const frameX = frameIndex * frameW;
  const frameY = rowIndex * frameH;


  const [sheetSize, setSheetSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = sheet;
    img.onload = () => setSheetSize({ w: img.width, h: img.height });
  }, []);


  return (
    <div
      className="pixelated"
      style={{
        width: frameW * scale,
        height: frameH * scale,

        backgroundImage: `url(${sheet})`,
        backgroundRepeat: "no-repeat",

        backgroundSize: `${sheetSize.w * scale}px ${sheetSize.h * scale}px`,

        backgroundPosition: `${-frameX * scale}px ${-frameY * scale}px`,
      }}

    />
  );
}
