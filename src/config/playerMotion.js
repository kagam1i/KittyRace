// Всё, что связано с таймингами/высотой прыжка и длительностью слайда,
// держим тут, чтобы не искать по проекту.

export const PLAYER_MOTION = {
  // Прыжок
  JUMP_DURATION_MS: 800, 
  JUMP_HEIGHT_PX: 70,   

  SLIDE_DURATION_MS: 800,
};

export function jumpCurve01(t) {
  const x = Math.max(0, Math.min(1, t));
  const s = x * x * (3 - 2 * x); 
  return Math.sin(Math.PI * s); 
}
