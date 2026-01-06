// Хук для подключения управления клавиатурой

// Правила управления:
// - Left/Right (← → или A/D) — смена полосы
// - Up (↑ или W) — jump (только из run)
// - Down (↓ или S) — slide (только из run)
// - Escape — pause


// чтобы не спамить jump/slide,
// мы читаем актуальный actionState через ref.

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  pauseGame,
  moveLeft,
  moveRight,
  setJump,
  setSlide,
  setRun,
} from "../../../features/game/gameSlice";

export function useGameControls() {
  const dispatch = useDispatch();
  const actionState = useSelector((s) => s.game.actionState);

  const actionStateRef = useRef(actionState);
  const actionTimeoutRef = useRef(null);

  // всегда держим в ref актуальное значение из Redux
  useEffect(() => {
    actionStateRef.current = actionState;
  }, [actionState]);

  useEffect(() => {
    function clearActionTimeout() {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = null;
      }
    }

    function handleKeyDown(e) {
      const key = e.key;

      // --- движение по полосам ---
      if (key === "ArrowLeft" || key === "a" || key === "ф") {
        dispatch(moveLeft());
        return;
      }

      if (key === "ArrowRight" || key === "d" || key === "в") {
        dispatch(moveRight());
        return;
      }

      // --- pause ---
      if (key === "Escape") {
        dispatch(pauseGame());
        return;
      }

      const isJumpKey = key === "ArrowUp" || key === "w" || key === "ц";
      const isSlideKey = key === "ArrowDown" || key === "s" || key === "ы";

      const currentAction = actionStateRef.current;

      // jump/slide запускается только если сейчас run
      if ((isJumpKey || isSlideKey) && currentAction !== "run") return;

      // --- jump ---
      if (isJumpKey) {
        clearActionTimeout();
        dispatch(setJump());

        actionTimeoutRef.current = setTimeout(() => {
          dispatch(setRun());
          actionTimeoutRef.current = null;
        }, 650);

        return;
      }

      // --- slide ---
      if (isSlideKey) {
        clearActionTimeout();
        dispatch(setSlide());

        actionTimeoutRef.current = setTimeout(() => {
          dispatch(setRun());
          actionTimeoutRef.current = null;
        }, 550);

        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    };
  }, [dispatch]);
}
