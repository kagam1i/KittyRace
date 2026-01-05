// Настройки спрайтов котиков
// FRAME_W/FRAME_H — размер клетки в атласе (32×32)
// SCALE_OPTIONS — разрешённые целочисленные масштабы (2×, 3×)
export const CAT_SHEET = {
  FRAME_W: 32,
  FRAME_H: 32,
  SCALE_OPTIONS: [2, 3],
};

// Соответствие: выбранный кот -> номер строки в атласе
export const CAT_ROW_BY_ID = {
  milo: 0,
  bruno: 1,
  luna: 2,
};

// Настройки анимаций котиков
export const CAT_ANIM = {
  run: { start: 0, frames: 4, fps: 8 },
  jump: { start: 4, frames: 3, fps: 5 },
  slide: { start: 7, frames: 3, fps: 5 },
};
