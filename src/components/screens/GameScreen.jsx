import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { pauseGame, moveLeft, moveRight, setJump, setSlide, setRun } from "../../features/game/gameSlice";


export function GameScreen() {
  const dispatch = useDispatch();
  const laneIndex = useSelector((state) => state.game.laneIndex);
  const actionState = useSelector((state) => state.game.actionState);


  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "ф") {
        dispatch(moveLeft());
      }

      if (e.key === "ArrowRight" || e.key === "d" || e.key === "в") {
        dispatch(moveRight());
      }

      if (e.key === "Escape") {
        dispatch(pauseGame());
      }

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "ц") {
        dispatch(setJump());

        // через 450мс вернуться в run
        setTimeout(() => {
          dispatch(setRun());
        }, 450);
      }

      if (e.key === "ArrowDown" || e.key === "s" || e.key === "ы") {
        dispatch(setSlide());

        // через 500мс вернуться в run
        setTimeout(() => {
          dispatch(setRun());
        }, 500);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    // очень важно: очистка!
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg p-6">
      {/* Верхний HUD */}
      <div className="flex items-center justify-between mb-6">
        <div className="ui-chip">
          счёт монеток: 0
        </div>

        <button
          className="ui-btn-ghost"
          onClick={() => dispatch(pauseGame())}
        >
          menu
        </button>
      </div>

      {/* Игровое поле */}
      <div className="grid place-items-center">
        <div
          className="
            relative
            w-[min(520px,92vw)]
            aspect-square
            rounded-[36px]
            bg-surface
            border border-border
            shadow-soft
            overflow-hidden
          "
        >
          {/* Сетка из 5 полос */}
          <div className="absolute inset-0 grid grid-cols-5">
            <div className="border-r border-border/40" />
            <div className="border-r border-border/40" />
            <div className="border-r border-border/40" />
            <div className="border-r border-border/40" />
            <div />
          </div>


          {/* Котик-заглушка */}
          <div
            className="absolute transition-all duration-150"
            style={{
              left: `${laneIndex * 20 + 10}%`,
              bottom:
                actionState === "jump" ? "40%" : "24px",
              transform: "translateX(-50%)",
            }}
          >
            <div
              className={
                "rounded-md bg-pink transition-all duration-150 " +
                (actionState === "slide"
                  ? "w-10 h-4"
                  : "w-6 h-6")
              }
            />
          </div>


          {/* Плейсхолдер центра */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center opacity-60">
              <div className="font-heading text-lg">
                игровое поле
              </div>
              <div className="text-sm">
                5 полос движения
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
