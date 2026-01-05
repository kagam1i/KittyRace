import { useDispatch } from "react-redux";
import { resumeGame, goToGameMenu } from "../../features/game/gameSlice";

export function PauseMenu() {
  const dispatch = useDispatch();

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-bg">
      {/* ui-board — “табличка” в стиле Stardew */}
      <div className="ui-board w-[min(520px,92vw)] p-6">
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
  );
}
