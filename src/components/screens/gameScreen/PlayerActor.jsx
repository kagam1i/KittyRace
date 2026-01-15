import { useEffect, useLayoutEffect, useRef, useState } from "react";

import CatSprite from "../../game/CatSprite";
import { PLAYER_RENDER } from "../../../config/playerRender";
import { PLAYER_MOTION, jumpCurve01 } from "../../../config/playerMotion";

const LANE_DAMPING = 22;

function laneCenterPx(laneIndex, fieldW) {
  const laneW = fieldW / 5;
  return (laneIndex + 0.5) * laneW;
}

export default function PlayerActor({
  laneIndex,
  actionState,
  selectedCatId,
  fieldW,
  subscribeWorld,
}) {
const zIndex = actionState === "slide" ? 8 : 8;

  const wrapperRef = useRef(null);

  const laneIndexRef = useRef(laneIndex);
  const fieldWRef = useRef(fieldW || 0);
  const renderXRef = useRef(0);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  const prevActionRef = useRef(actionState);
  const jumpStartMsRef = useRef(0);

  const [jumpPhase, setJumpPhase] = useState(null);

  useEffect(() => {
    laneIndexRef.current = laneIndex;
  }, [laneIndex]);

  useEffect(() => {
    fieldWRef.current = fieldW || 0;
  }, [fieldW]);

  useEffect(() => {
    if (prevActionRef.current !== "jump" && actionState === "jump") {
      jumpStartMsRef.current = performance.now();
      setJumpPhase("up");
    }

    if (prevActionRef.current === "jump" && actionState !== "jump") {
      setJumpPhase(null);
    }

    prevActionRef.current = actionState;
  }, [actionState]);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const w = fieldWRef.current;
    if (!w) return;

    const target = laneCenterPx(laneIndexRef.current, w);
    renderXRef.current = target;
    el.style.left = `${Math.round(target)}px`;
    el.style.bottom = `${PLAYER_RENDER.GROUND_BOTTOM_PX}px`;
  }, [fieldW]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    lastTsRef.current = performance.now();

    const step = (ts, dtOverrideSec) => {
      const w = fieldWRef.current;

      const dt =
        typeof dtOverrideSec === "number"
          ? Math.min(0.05, Math.max(0, dtOverrideSec))
          : Math.min(0.05, Math.max(0, (ts - lastTsRef.current) / 1000));

      lastTsRef.current = ts;

      if (w > 0) {
        const targetX = laneCenterPx(laneIndexRef.current, w);
        const x = renderXRef.current;
        const alpha = 1 - Math.exp(-LANE_DAMPING * dt);

        let next = x + (targetX - x) * alpha;
        if (Math.abs(targetX - next) < 0.35) next = targetX;

        renderXRef.current = next;
        el.style.left = `${Math.round(next)}px`;
      }

      const ground = PLAYER_RENDER.GROUND_BOTTOM_PX;

      if (actionState === "jump") {
        const start = jumpStartMsRef.current || ts;
        const tNorm = Math.max(
          0,
          Math.min(1, (ts - start) / PLAYER_MOTION.JUMP_DURATION_MS)
        );

        const y = jumpCurve01(tNorm) * PLAYER_MOTION.JUMP_HEIGHT_PX;
        el.style.bottom = `${Math.round(ground + y)}px`;

        let phase = "up";
        if (tNorm < 0.45) phase = "up";
        else if (tNorm < 0.55) phase = "apex";
        else phase = "down";

        setJumpPhase((prev) => (prev === phase ? prev : phase));
      } else {
        el.style.bottom = `${ground}px`;
      }
    };

    if (typeof subscribeWorld === "function") {
      const unsubscribe = subscribeWorld(({ ts, dt }) => {
        step(ts, dt);
      });
      return unsubscribe;
    }

    let mounted = true;
    const tick = (ts) => {
      if (!mounted) return;
      step(ts, undefined);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [actionState, subscribeWorld]);

  const safeLeft =
    fieldW && fieldW > 0 ? `${Math.round(laneCenterPx(laneIndex, fieldW))}px` : "0px";

  return (
    <div
      ref={wrapperRef}
      className="absolute"
      style={{
        left: safeLeft,
        bottom: `${PLAYER_RENDER.GROUND_BOTTOM_PX}px`,
        transform: "translate3d(-50%, 0, 0)",
        zIndex,
      }}
    >
      <CatSprite catId={selectedCatId} actionState={actionState} jumpPhase={jumpPhase} />
    </div>
  );
}
