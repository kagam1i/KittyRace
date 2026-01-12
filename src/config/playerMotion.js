// src/config/playerMotion.js
//
// Всё, что связано с таймингами/высотой прыжка и длительностью слайда,
// держим тут, чтобы не искать по проекту.

export const PLAYER_MOTION = {
  // Прыжок
  JUMP_DURATION_MS: 650, // общая длительность полёта
  JUMP_HEIGHT_PX: 90,    // высота прыжка (примерно ~1/5 экрана на поле 500px)

  // Слайд (НЕ меняем механику, просто тайминг в одном месте)
  SLIDE_DURATION_MS: 550,
};

// “колокол” 0..1 -> 0..1..0, плавный
export function jumpCurve01(t) {
  const x = Math.max(0, Math.min(1, t));
  const s = x * x * (3 - 2 * x); // smootherstep
  return Math.sin(Math.PI * s);  // 0..1..0
}
