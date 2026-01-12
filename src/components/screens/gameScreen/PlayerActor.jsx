import { useEffect, useLayoutEffect, useRef, useState } from "react";

import CatSprite from "../../game/CatSprite";
import { PLAYER_RENDER } from "../../../config/playerRender";
import { PLAYER_MOTION } from "../../../config/playerMotion";

function laneCenterPx(laneIndex, fieldW) {
  const laneW = fieldW / 5;
  return (laneIndex + 0.5) * laneW;
}

// 0..1 → 0..1..0 (мягкая дуга)
function jumpCurve(t) {
  // smootherstep: 0..1 мягко
  const s = t * t * (3 - 2 * t);
  // sin(pi*s): 0..1..0
  return Math.sin(Math.PI * s);
}

function jumpPhaseFromT(tNorm) {
  const c = PLAYER_MOTION.JUMP_APEX_CENTER;
  const hw = PLAYER_MOTION.JUMP_APEX_HALF_WIDTH;

  if (tNorm < c - hw) return "up";
  if (tNorm <= c + hw) return "apex";
  return "down";
}

export default function PlayerActor({ laneIndex, actionState, selectedCatId, fieldW }) {
  // ✅ slide как был — рисуем кота ниже препятствий
  const zIndex = actionState === "slide" ? 4 : 8;

  const wrapperRef = useRef(null);

  // refs — чтобы rAF не перезапускался и не ловил stale значения
  const laneIndexRef = useRef(laneIndex);
  const fieldWRef = useRef(fieldW || 0);
  const renderXRef = useRef(0);

  const prevActionRef = useRef(actionState);
  const jumpStartMsRef = useRef(0);

  // jumpPhase нужен для CatSprite (кадры 4/5/6)
  const [jumpPhase, setJumpPhase] = useState(null);
  const jumpPhaseRef = useRef(null);

  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    laneIndexRef.current = laneIndex;
  }, [laneIndex]);

  useEffect(() => {
    fieldWRef.current = fieldW || 0;
  }, [fieldW]);

  useEffect(() => {
    // старт прыжка: фиксируем время, чтобы дуга была стабильной
    if (prevActionRef.current !== "jump" && actionState === "jump") {
      jumpStartMsRef.current = performance.now();
      jumpPhaseRef.current = "up";
      setJumpPhase("up");
    }

    // вышли из прыжка — сброс фаз
    if (prevActionRef.current === "jump" && actionState !== "jump") {
      jumpPhaseRef.current = null;
      setJumpPhase(null);
    }

    prevActionRef.current = actionState;
  }, [actionState]);

  // Инициализация X без скачка
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const w = fieldWRef.current;
    if (!w) return;

    const target = laneCenterPx(laneIndexRef.current, w);
    renderXRef.current = target;
    el.style.left = `${Math.round(target)}px`;
  }, [fieldW]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let mounted = true;
    lastTsRef.current = performance.now();

    const tick = (ts) => {
      if (!mounted) return;

      const w = fieldWRef.current;

      // --- smooth X ---
      if (w > 0) {
        const dt = Math.min(0.05, Math.max(0, (ts - lastTsRef.current) / 1000));
        lastTsRef.current = ts;

        const targetX = laneCenterPx(laneIndexRef.current, w);
        const x = renderXRef.current;

        const alpha = 1 - Math.exp(-PLAYER_MOTION.LANE_DAMPING * dt);
        let next = x + (targetX - x) * alpha;

        if (Math.abs(targetX - next) < 0.35) next = targetX;

        renderXRef.current = next;
        el.style.left = `${Math.round(next)}px`;
      }

      // --- smooth Y (jump) ---
      const ground = PLAYER_RENDER.GROUND_BOTTOM_PX;
      let bottomPx = ground;

      if (actionState === "jump") {
        const start = jumpStartMsRef.current || ts;
        const tNorm = Math.max(
          0,
          Math.min(1, (ts - start) / PLAYER_MOTION.JUMP_DURATION_MS)
        );

        const y = jumpCurve(tNorm) * PLAYER_MOTION.JUMP_HEIGHT_PX;
        bottomPx = ground + y;

        const phase = jumpPhaseFromT(tNorm);
        if (phase !== jumpPhaseRef.current) {
          jumpPhaseRef.current = phase;
          setJumpPhase(phase); // будет 2 переключения за прыжок, не каждый кадр
        }
      }

      // slide/run — остаются на земле
      el.style.bottom = `${Math.round(bottomPx)}px`;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [actionState]);

  const safeLeft =
    fieldW && fieldW > 0 ? `${Math.round(laneCenterPx(laneIndex, fieldW))}px` : "0px";

  return (
    <div
      ref={wrapperRef}
      className="absolute"
      style={{
        left: safeLeft,
        bottom: `${PLAYER_RENDER.GROUND_BOTTOM_PX}px`, // стартовое значение, дальше перетирается rAF
        transform: "translate3d(-50%, 0, 0)",
        zIndex,
      }}
    >
      <CatSprite catId={selectedCatId} actionState={actionState} jumpPhase={jumpPhase} />
    </div>
  );
}
