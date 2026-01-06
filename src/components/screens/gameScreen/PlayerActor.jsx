// PlayerActor — позиционирование кота на экране
//
// Позиционирование:
// по X: центр выбранной полосы (0..4) → 10%, 30%, 50%, 70%, 90%
// по Y: снизу, в зависимости от actionState (run / jump / slide)
//
// ВАЖНО ПРО СЛОИ:
// Во время SLIDE кот должен “проскальзывать под препятствием”.
// Поэтому на slide мы понижаем zIndex кота, а препятствия остаются выше.

import CatSprite from "../../game/CatSprite";
import { PLAYER_RENDER } from "../../../config/playerRender";

export default function PlayerActor({ laneIndex, actionState, selectedCatId }) {
  // ✅ во время slide кот рисуется ниже препятствий
  const zIndex = actionState === "slide" ? 4 : 8;

  return (
    <div
      className="absolute transition-all duration-150"
      style={{
        left: `${laneIndex * 20 + 10}%`,
        bottom:
          actionState === "jump"
            ? `${PLAYER_RENDER.JUMP_BOTTOM_PERCENT}%`
            : `${PLAYER_RENDER.GROUND_BOTTOM_PX}px`,
        transform: "translateX(-50%)",
        zIndex,
      }}
    >
      <CatSprite catId={selectedCatId} actionState={actionState} />
    </div>
  );
}
