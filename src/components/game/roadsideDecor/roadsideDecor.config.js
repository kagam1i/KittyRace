const PRESET_C = {
  GAP_BASE_Y_PX: 98,
  GAP_JITTER_Y_PX: 22,
  SMALL_SPAWN_CHANCE: 0.66,
  GRASS_CLUMP_CHANCE: 0.32,
};

const ACTIVE_PRESET = PRESET_C;


export const ROADSIDE_DECOR = {
  SCALE: 2,

  GAP_BASE_Y_PX: ACTIVE_PRESET.GAP_BASE_Y_PX,
  GAP_JITTER_Y_PX: ACTIVE_PRESET.GAP_JITTER_Y_PX,
  SMALL_SPAWN_CHANCE: ACTIVE_PRESET.SMALL_SPAWN_CHANCE,

  DESPAWN_PADDING_PX: 140,

  GRASS_CLUMP: {
    CHANCE: ACTIVE_PRESET.GRASS_CLUMP_CHANCE,
    X_OFFSET_PERCENT: 8,
    Y_OFFSET_PX: 10,
  },

  X_BY_TYPE_PERCENT: {
    small: {
      left: { min: 25, max: 75 },
      right: { min: 25, max: 75 },
    },
    tree: {
      left: { min: 18, max: 55 },
      right: { min: 45, max: 82 },
    },
  },

  TREE_RULES: {
    MIN_SPACING_PX: 320,
    CHANCE: 0.9,
  },

  TYPES: {
    grass: {
      src: new URL("../../../assets/environment/decor/grass.png", import.meta.url)
        .href,
      w: 31,
      h: 29,
      z: 1,
      group: "small",
    },

    bush: {
      src: new URL("../../../assets/environment/decor/bush.png", import.meta.url)
        .href,
      w: 36,
      h: 31,
      z: 2,
      group: "small",
    },

    flower1: {
      src: new URL(
        "../../../assets/environment/decor/flower1.png",
        import.meta.url
      ).href,
      w: 28,
      h: 30,
      z: 2,
      group: "small",
    },

    flower2: {
      src: new URL(
        "../../../assets/environment/decor/flower2.png",
        import.meta.url
      ).href,
      w: 35,
      h: 34,
      z: 2,
      group: "small",
    },

    flower3: {
      src: new URL(
        "../../../assets/environment/decor/flower3.png",
        import.meta.url
      ).href,
      w: 33,
      h: 32,
      z: 2,
      group: "small",
    },

    tree1: {
      src: new URL("../../../assets/environment/decor/tree1.png", import.meta.url)
        .href,
      w: 50,
      h: 61,
      z: 3,
      group: "tree",
    },

    tree2: {
      src: new URL("../../../assets/environment/decor/tree2.png", import.meta.url)
        .href,
      w: 51,
      h: 53,
      z: 3,
      group: "tree",
    },

    tree3: {
      src: new URL("../../../assets/environment/decor/tree3.png", import.meta.url)
        .href,
      w: 23,
      h: 29,
      z: 3,
      group: "tree",
    },
  },

  SMALL_WEIGHTS: [
    { type: "grass", weight: 1 },
    { type: "bush", weight: 1 },
    { type: "flower1", weight: 1 },
    { type: "flower2", weight: 1 },
    { type: "flower3", weight: 1 },
  ],

  TREE_VARIANTS: ["tree1", "tree2", "tree3"],
};
