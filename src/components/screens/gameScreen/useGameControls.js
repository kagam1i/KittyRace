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

import { PLAYER_MOTION } from "../../../config/playerMotion";

export function useGameControls(targetRef) {
  const dispatch = useDispatch();
  const actionState = useSelector((s) => s.game.actionState);

  const actionStateRef = useRef(actionState);
  const actionTimeoutRef = useRef(null);

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

      const currentAction = actionStateRef.current;
      if ((isJumpKey || isSlideKey) && currentAction !== "run") return;

      if (isJumpKey) {
        clearActionTimeout();
        dispatch(setJump());

        actionTimeoutRef.current = setTimeout(() => {
          dispatch(setRun());
          actionTimeoutRef.current = null;
        }, PLAYER_MOTION.JUMP_DURATION_MS);

        return;
      }

      if (isSlideKey) {
        clearActionTimeout();
        dispatch(setSlide());

        // ✅ slide НЕ ТРОГАЕМ: оставляем как было
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

  // -------------------------------------------------------
  // Touch / Pointer controls (swipe)
  // -------------------------------------------------------
  useEffect(() => {
    const el = targetRef?.current;
    if (!el) return;

    const SWIPE_MIN_PX = 26;
    const SWIPE_MAX_TIME_MS = 450;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startT = 0;

    function clearActionTimeout() {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = null;
      }
    }

    function triggerJump() {
      const currentAction = actionStateRef.current;
      if (currentAction !== "run") return;

      clearActionTimeout();
      dispatch(setJump());

      actionTimeoutRef.current = setTimeout(() => {
        dispatch(setRun());
        actionTimeoutRef.current = null;
      }, PLAYER_MOTION.JUMP_DURATION_MS);
    }

    function triggerSlide() {
      const currentAction = actionStateRef.current;
      if (currentAction !== "run") return;

      clearActionTimeout();
      dispatch(setSlide());

      // ✅ slide НЕ ТРОГАЕМ
      actionTimeoutRef.current = setTimeout(() => {
        dispatch(setRun());
        actionTimeoutRef.current = null;
      }, 550);
    }

    function onPointerDown(e) {
      if (e.isPrimary === false) return;

      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();

      try {
        el.setPointerCapture?.(e.pointerId);
      } catch (_) {}
    }

    function onPointerUp(e) {
      if (!isDown) return;
      isDown = false;

      const dt = performance.now() - startT;
      if (dt > SWIPE_MAX_TIME_MS) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const isSwipe = Math.max(absX, absY) >= SWIPE_MIN_PX;
      if (!isSwipe) return;

      if (absX > absY) {
        if (dx < 0) dispatch(moveLeft());
        else dispatch(moveRight());
      } else {
        if (dy < 0) triggerJump();
        else triggerSlide();
      }
    }

    function onPointerCancel() {
      isDown = false;
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [dispatch, targetRef]);
}
