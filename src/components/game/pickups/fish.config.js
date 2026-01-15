import fishIcon from "../../../assets/environment/fish.png";
import { ROAD_SCROLL_SPEED_PX_PER_SEC } from "../../../config/trackRoad";

export const FISH_CONFIG = {
  IMAGE: fishIcon,

  SIZE_PX: 16,
  SCALE: 2,

  SPAWN_GAP_PX: { min: 160, max: 260 },

  MIN_LANE_GAP_PX: 52,

  PICKUP_WINDOW_PX: 14,

  SPEED_PX_PER_SEC: ROAD_SCROLL_SPEED_PX_PER_SEC,

  SIDESTEP_GAP_PX_BY_SCREEN: {
    desktop: 8,
    tablet: 6,
    mobile: 4,
  },

  SCREEN_BREAKPOINTS_PX: {
    mobileMax: 479,
    tabletMax: 899,
  },
};
