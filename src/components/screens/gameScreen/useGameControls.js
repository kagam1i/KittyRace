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

/**
 * useGameControls
 *
 * Desktop:
 * - Left/Right (← → или A/D) — смена полосы
 * - Up (↑ или W) — jump (только из run)
 * - Down (↓ или S) — slide (только из run)
 * - Escape — pause
 *
 * Touch (mobile/tablet):
 * - swipe left/right -> смена полосы
 * - swipe up -> jump
 * - swipe down -> slide
 *
 * ⚠️ Чтобы не ломать архитектуру, оставляем всю логику в одном хуке.
 * GameScreen может (не обязательно) передать ref на игровое поле, чтобы
 * свайпы работали только внутри него (и не конфликтовали со скроллом страницы).
 */
export function useGameControls(targetRef) {
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

  // -------------------------------------------------------
  // Touch / Pointer controls (swipe)
  // -------------------------------------------------------
  useEffect(() => {
    const el = targetRef?.current;
    if (!el) return;

    // Порог, чтобы случайный микродвиж не считался свайпом
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
      }, 650);
    }

    function triggerSlide() {
      const currentAction = actionStateRef.current;
      if (currentAction !== "run") return;
      clearActionTimeout();
      dispatch(setSlide());
      actionTimeoutRef.current = setTimeout(() => {
        dispatch(setRun());
        actionTimeoutRef.current = null;
      }, 550);
    }

    function onPointerDown(e) {
      // только primary pointer
      if (e.isPrimary === false) return;

      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();

      // Чтобы не выделялся текст при свайпе
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch (_) {
        // ignore
      }
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

      // доминирующее направление
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

    // pointer events покрывают и touch, и pen, и mouse
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
