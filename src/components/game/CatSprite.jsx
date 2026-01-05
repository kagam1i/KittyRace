import sheet from "../../assets/sprites/cats/cats_sheet.png";
// React хуки:
// useState — хранить локальное состояние (кадр, размеры картинки)
// useEffect — запускать код по событиям (после рендера, при изменениях)
// useMemo — “кешировать” вычисления, чтобы не пересчитывать лишний раз
import { useEffect, useState, useMemo } from "react";

// константы 
import { CAT_ROW_BY_ID, CAT_SHEET, CAT_ANIM } from "../../config/catSprite";

export default function CatSprite({ catId, actionState = "run" }) {
  // Размер одной “ячейки” в спрайт-листе(32)
  const frameW = CAT_SHEET.FRAME_W;
  const frameH = CAT_SHEET.FRAME_H;

  // Масштаб в игре - 2× (т.е 32px превратится в 64px на экране)
  const scale = CAT_SHEET.SCALE_OPTIONS[0]; // 2

  // rowIndex — номер строки на спрайт-листе (какой кот)
  // catId приходит из Redux (milo / bruno / luna)
  // Если вдруг catId неизвестен — берём 0 (чтобы все не падало)
  const rowIndex = CAT_ROW_BY_ID[catId] ?? 0;

  // Выбираем настройки анимации по текущему состоянию персонажа из СAT_ANIM

  // useMemo тут нужен, чтобы anim не создавался заново без необходимости.
  const anim = useMemo(() => {
    return CAT_ANIM[actionState] ?? CAT_ANIM.run;
  }, [actionState]);

  // sheetSize — реальные размеры PNG-картинки в пикселях.
  const [sheetSize, setSheetSize] = useState({ w: 0, h: 0 });

  // localFrame — “локальный” кадр внутри текущей анимации, т.е. для jump/slide это 0..2.
  const [localFrame, setLocalFrame] = useState(0);

  // Загружаем картинку и узнаём её реальный размер (width/height)
  useEffect(() => {
    const img = new Image(); // создаём “виртуальную” картинку
    img.src = sheet;         // говорим, какой файл загрузить
    img.onload = () => {
      // когда загрузилась — записываем размеры
      setSheetSize({ w: img.width, h: img.height });
    };
  }, []);

  // Управление анимацией:
  // - если actionState === "run" -> крутим по кругу бесконечно
  // - если jump/slide -> проигрываем один раз и останавливаемся на последнем кадре
  useEffect(() => {
    // Когда меняется состояние (run -> jump и т.д.) - всегда начинаем анимацию с первого кадра
    setLocalFrame(0);

    // run крутится по кругу, jump/slide — проигрываются 1 раз
    const isLooping = actionState === "run";


    // Преобразование fps в миллисекунды между сменой кадров
    const intervalMs = Math.round(1000 / anim.fps);

    // setInterval будет вызываться каждые intervalMs
    const id = setInterval(() => {
      setLocalFrame((prev) => {
        if (isLooping) {
          // run - бесконечно по кругу
          return (prev + 1) % anim.frames;
        }
        // jump/slide - проиграть один раз и замереть на последнем кадре
        return Math.min(prev + 1, anim.frames - 1);
      });
    }, intervalMs);

    // Очистка интервала при размонтировании или смене actionState
    return () => clearInterval(id);
  }, [actionState, anim.fps, anim.frames]);

  // Пока неизвестны размеры картинки — не рисуем ничего, т.к. иначе backgroundSize будет 0 и спрайт поедет хрен куда пойми
  if (sheetSize.w === 0 || sheetSize.h === 0) return null;

  // Получение “глобальный” кадра на спрайт-листе:
  // anim.start — с какого кадра начинается действие в строке
  // localFrame — какой кадр внутри действия

  const sheetFrameIndex = anim.start + localFrame;

  // перевод “номера кадра” в координаты X на картинке
  const frameX = sheetFrameIndex * frameW;

  // координата Y зависит от выбранного кота (rowIndex)
  const frameY = rowIndex * frameH;

  // slide делаем визуально “приплюснутым”
  const isSlide = actionState === "slide";
  const renderH = isSlide ? Math.round(frameH * 0.7) : frameH;

  return (
    <div
      // pixelated — класс, который отключает размытие пикселей
      className="pixelated"
      style={{
        // размер “окошка”, через которое мы смотрим на спрайт-лист
        width: frameW * scale,
        height: renderH * scale,

        // прячем лишнее, чтобы при slide “срезать” по высоте
        overflow: "hidden",

        // подкладываем весь спрайт-лист как фон
        backgroundImage: `url(${sheet})`,
        backgroundRepeat: "no-repeat",

        //увеличиваем весь спрайт-лист ровно в scale раз,
        // иначе будет “сплющивание/растяжение” и неверные позиции
        backgroundSize: `${sheetSize.w * scale}px ${sheetSize.h * scale}px`,

        // сдвигаем фон так, чтобы в “окошке” оказался нужный кадр
        backgroundPosition: `${-frameX * scale}px ${-frameY * scale}px`,
      }}
    />
  );
}
