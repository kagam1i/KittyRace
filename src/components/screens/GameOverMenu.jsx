import { useDispatch } from "react-redux";
import { startGame, goToGameMenu } from "../../features/game/gameSlice";

import backgroundImg from "../../assets/background.png";

/**
 * Экран Game Over.
 * Сейчас он просто показывает табличку и 2 кнопки:
 * - Restart: начать новую попытку
 * - Main menu: вернуться в главное меню
 */
export function GameOverMenu() {
  const dispatch = useDispatch();

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-bg">
      {/* ui-board — “табличка” в стиле Stardew */}
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
        {/* лёгкая “вуаль”, чтобы текст читался */}
        <div className="absolute inset-0 bg-white/35 pointer-events-none" />

        <div className="relative">
          <h1 className="ui-board-title">game over</h1>

          <div className="mt-10 grid gap-4 place-items-center">
            <button
              className="ui-btn-primary px-10 py-3 text-lg"
              onClick={() => dispatch(startGame())}
            >
              restart
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
