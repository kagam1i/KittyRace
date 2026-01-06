import jump1 from "../../../assets/environment/obstacles/jump1.png";
import jump2 from "../../../assets/environment/obstacles/jump2.png";
import jump3 from "../../../assets/environment/obstacles/jump3.png";

import sidestep1 from "../../../assets/environment/obstacles/sidestep1.png";
import sidestep2 from "../../../assets/environment/obstacles/sidestep2.png";

import slide1 from "../../../assets/environment/obstacles/slide1.png";

export const OBSTACLE_TYPES = {
  jump: {
    id: "jump",
    images: [jump1, jump2, jump3],
    rule: "needAction",
    needAction: "jump",
  },

  slide: {
    id: "slide",
    images: [slide1],
    rule: "needAction",
    needAction: "slide",
  },

  sidestep: {
    id: "sidestep",
    images: [sidestep1, sidestep2],
    rule: "avoidLane",
  },
};

export const OBSTACLES_CONFIG = {
  SCALE: 2,

  // Кот стоит ближе к низу экрана
  PLAYER_Y_PERCENT: 72,

  // Насколько “широкое” окно столкновения по Y
  HIT_WINDOW_PX: 8,
  JUMP_HIT_WINDOW_PX: 14,

  // Расстояние между препятствиями (по вертикали)
  SPAWN_GAP_PX: {
    min: 140,
    max: 240,
  },

  // Равные шансы → максимальное разнообразие
  TYPE_WEIGHTS: [
    { type: "jump", w: 1 },
    { type: "slide", w: 1 },
    { type: "sidestep", w: 1 },
  ],

  // Защита от “стены” в одной полосе
  MAX_SAME_LANE_STREAK: 2,

  // ✅ NEW:
  // Минимальная дистанция (по Y, в пикселях скролла) между ДВУМЯ препятствиями,
  // если они оказались в ОДНОЙ полосе подряд.
  //
  // Зачем:
  // - прыжок имеет фиксированное окно времени;
  // - если сразу после jump появляется avoidLane в той же полосе,
  //   игрок может "приземлиться" прямо в него.
  //
  // Это значение — именно про "честность" геймплея, не про сложность.
  SAME_LANE_MIN_GAP_PX: 280,

  // Логический размер препятствий (как у кота)
  BASE_SIZE_PX: 32,

  // ✅ NEW:
  // Минимальный гэп (в пикселях скролла) между двумя "action" препятствиями подряд,
  // если они требуют РАЗНЫЕ действия (jump -> slide или slide -> jump).
  // Это убирает ситуации, когда игрок физически не успевает среагировать.
  ACTION_SWITCH_MIN_GAP_PX: 240,
};
