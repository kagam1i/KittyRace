import { useDispatch } from "react-redux";
import { resumeGame, goToGameMenu } from "../../features/game/gameSlice";

import backgroundImg from "../../assets/background.png";

export function PauseMenu() {
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
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />

        <div className="relative">
          {/* ui-board-title — заголовок на табличке */}
          <h1 className="ui-board-title">Kitty race</h1>

          <div className="mt-10 grid gap-4 place-items-center">
            <button
              className="ui-btn-primary px-10 py-3 text-lg"
              onClick={() => dispatch(resumeGame())}
            >
              resume
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
