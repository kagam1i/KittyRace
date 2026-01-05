import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

// Экшены из gameSlice 
import {
  pauseGame,
  moveLeft,
  moveRight,
  setJump,
  setSlide,
  setRun,
} from "../../features/game/gameSlice";

import CatSprite from "../game/CatSprite";
import { PLAYER_RENDER } from "../../config/playerRender";

export function GameScreen() {
  const dispatch = useDispatch();

  // laneIndex — текущая полоса (0..4)
  const laneIndex = useSelector((state) => state.game.laneIndex);

  // actionState — текущее действие кота (run/jump/slide)
  const actionState = useSelector((state) => state.game.actionState);

  // selectedCatId — выбранный кот в меню (milo/bruno/luna)
  const selectedCatId = useSelector((s) => s.game.selectedCatId);

  // actionStateRef  - позволяет обработчику клавиш видеть актуальное состояние
  const actionStateRef = useRef(actionState);

  // actionTimeoutRef хранит id таймера возврата в run (после jump/slide).
  const actionTimeoutRef = useRef(null);

  // Каждый раз, когда actionState меняется в Redux, обновляем ref, чтобы handleKeyDown видел актуальное состояние
  useEffect(() => {
    actionStateRef.current = actionState;
  }, [actionState]);

  // Обработчик клавиш для управления игрой
  useEffect(() => {
    // отмена текущего таймера возврата в run
    function clearActionTimeout() {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = null;
      }
    }

    function handleKeyDown(e) {
      const key = e.key;

      if (key === "ArrowLeft" || key === "a" || key === "ф") {
        dispatch(moveLeft());
        return;
      }

      if (key === "ArrowRight" || key === "d" || key === "в") {
        dispatch(moveRight());
        return;
      }

      if (key === "Escape") {
        dispatch(pauseGame());
        return;
      }

      const isJumpKey = key === "ArrowUp" || key === "w" || key === "ц";
      const isSlideKey = key === "ArrowDown" || key === "s" || key === "ы";

      // забор актуального состояния из реф
      const currentAction = actionStateRef.current;

      // jump/slide запускается только если сейчас мы в run(чтобы не спамить)
      if ((isJumpKey || isSlideKey) && currentAction !== "run") return;

      // Прыжок
      if (isJumpKey) {
        clearActionTimeout();

        dispatch(setJump());

        actionTimeoutRef.current = setTimeout(() => {
          dispatch(setRun());
          actionTimeoutRef.current = null;
        }, 450);

        return;
      }

      // Слайд
      if (isSlideKey) {
        clearActionTimeout();
        dispatch(setSlide());

        actionTimeoutRef.current = setTimeout(() => {
          dispatch(setRun());
          actionTimeoutRef.current = null;
        }, 500);

        return;
      }
    }

    // слушаем нажатия клавиш
    window.addEventListener("keydown", handleKeyDown);

    // очищаем обработчик и таймер при размонтировании
    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      // очищаем таймер возврата в run
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg p-6">
      {/* Верхний HUD */}
      <div className="flex items-center justify-between mb-6">
        <div className="ui-chip">счёт монеток: 0</div>

        {/* Кнопка паузы */}
        <button className="ui-btn-ghost" onClick={() => dispatch(pauseGame())}>
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
          {/* Сетка из 5 полос (визуальная, пока без логики коллизий) */}
          <div className="absolute inset-0 grid grid-cols-5">
            <div className="border-r border-border/40" />
            <div className="border-r border-border/40" />
            <div className="border-r border-border/40" />
            <div className="border-r border-border/40" />
            <div />
          </div>

          {/* Котик */}
          <div
            className="absolute transition-all duration-150"
            style={{
              left: `${laneIndex * 20 + 10}%`,
              bottom:
                actionState === "jump"
                  ? `${PLAYER_RENDER.JUMP_BOTTOM_PERCENT}%`
                  : `${PLAYER_RENDER.GROUND_BOTTOM_PX}px`,
              transform: "translateX(-50%)",
            }}
          >
            {/* Рендерим выбранного кота и передаём его состояние */}
            <CatSprite catId={selectedCatId} actionState={actionState} />
          </div>

          {/* Плейсхолдер центра */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
