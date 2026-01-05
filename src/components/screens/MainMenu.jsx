import { useDispatch, useSelector } from "react-redux";
import { startGame, selectCat } from "../../features/game/gameSlice";
import { toggleSound } from "../../features/settings/settingsSlice";
import { CATS } from "../../features/game/cats";

export function MainMenu() {
  const dispatch = useDispatch();

  const selectedCatId = useSelector((s) => s.game.selectedCatId);
  const soundEnabled = useSelector((s) => s.settings.soundEnabled);

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-bg">
      <div className="ui-panel w-[min(520px,92vw)] p-6">
        <div className="flex items-center justify-between">
          <button
            className="ui-btn-ghost"
            onClick={() => dispatch(toggleSound())}
          >
            {soundEnabled ? "sound on" : "sound off"}
          </button>

          <h1 className="ui-title">Kitty race</h1>

          <div className="w-[90px]" />
        </div>

        <div className="mt-10 grid place-items-center">
          <button
            className="ui-btn-primary px-10 py-3 text-lg"
            onClick={() => dispatch(startGame())}
          >
            Start
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          {CATS.map((cat) => (
            <button
              key={cat.id}
              className={
                cat.id === selectedCatId
                  ? "ui-btn-accent"
                  : "ui-btn-ghost"
              }
              onClick={() => dispatch(selectCat(cat.id))}
            >
              {cat.name}
            </button>
          ))}
        </div>


        {/* проверка */}
        {/* <div className="text-xs opacity-60 mt-2">
          selectedCatId: {selectedCatId}
        </div> */}

      </div>
    </div>
  );
}
