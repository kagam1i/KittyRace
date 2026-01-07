import { useDispatch } from "react-redux";
import { resumeGame, goToGameMenu } from "../../features/game/gameSlice";

import backgroundImg from "../../assets/background.png";

/**
 * PauseMenu
 * - overlay поверх GameScreen
 * - “табличка” (ui-board)
 * - кнопки continue / main menu
 *
 * ✅ Облака — ВНУТРИ таблички.
 */
export function PauseMenu() {
  const dispatch = useDispatch();

  return (
    <div className="absolute inset-0 grid place-items-center p-6 bg-black/30 z-50">
      {/* ui-board — “табличка” */}
      <div
        className="ui-board w-[min(520px,92vw)] p-6 relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* ✅ Облака — внутри таблички */}
        <div
          className="ui-menu-clouds pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImg})`,
            imageRendering: "pixelated",
          }}
          aria-hidden="true"
        />

        {/* лёгкая “вуаль”, чтобы текст читался */}
        <div className="absolute inset-0 bg-white/35 pointer-events-none" />

        <div className="relative">
          <h1 className="ui-board-title">pause</h1>

          <div className="mt-10 grid gap-4 place-items-center">
            <button
              className="ui-btn-primary px-10 py-3 text-lg"
              onClick={() => dispatch(resumeGame())}
            >
              continue
            </button>

            <button
              className="ui-btn-ghost px-10 py-3 text-lg"
              onClick={() => dispatch(goToGameMenu())}
            >
              main menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
