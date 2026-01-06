// Хук для измерения ширины контейнера игрового поля и
// возвращения размера в пикселях

import { useEffect, useRef, useState } from "react";

export function useSquareFieldSize() {
  const fieldRef = useRef(null);
  const [fieldPx, setFieldPx] = useState(0);

  useEffect(() => {
    function updateFieldSize() {
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      setFieldPx(Math.floor(rect.width));
    }

    // Инициализация + ресайз
    updateFieldSize();
    window.addEventListener("resize", updateFieldSize);
    return () => window.removeEventListener("resize", updateFieldSize);
  }, []);

  return { fieldRef, fieldPx };
}
