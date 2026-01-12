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

  PLAYER_Y_PERCENT: 72,

  HIT_WINDOW_PX: 10,
  JUMP_HIT_WINDOW_PX: 65,

  // ✅ Плотнее (меньше пустоты), но без "стены"
  SPAWN_GAP_PX: {
    min: 110,
    max: 190,
  },

  TYPE_WEIGHTS: [
    { type: "jump", w: 1 },
    { type: "slide", w: 1 },
    { type: "sidestep", w: 1 },
  ],

  MAX_SAME_LANE_STREAK: 2,

  // ✅ защищает от "jump -> приземление в sidestep" + от наложений
  SAME_LANE_MIN_GAP_PX: 280,

  // ✅ защищает от jump <-> slide "впритык"
  // Сделали чуть больше, чтобы игрок физически успевал
  // среагировать (особенно на мобильном свайпом).
  ACTION_SWITCH_MIN_GAP_PX: 360,

  BASE_SIZE_PX: 32,
};
