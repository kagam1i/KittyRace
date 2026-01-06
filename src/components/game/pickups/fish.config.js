import fishIcon from "../../../assets/environment/fish.png";
import { ROAD_SCROLL_SPEED_PX_PER_SEC } from "../../../config/trackRoad";

export const FISH_CONFIG = {
  // используем тот же ассет, что в HUD
  IMAGE: fishIcon,

  // размер и масштаб (подгонишь по ощущениям)
  SIZE_PX: 16,
  SCALE: 2,

  // частота появления (расстояние по Y)
  SPAWN_GAP_PX: { min: 160, max: 260 },

  // где “линия подбора” (как у препятствий — от низа)
  PICKUP_WINDOW_PX: 14,

  // скорость берём из конфига дороги (всё едет синхронно)
  SPEED_PX_PER_SEC: ROAD_SCROLL_SPEED_PX_PER_SEC,
};
