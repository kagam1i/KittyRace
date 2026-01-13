import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import FishSprite from "./FishSprite";
import { FISH_CONFIG } from "./fish.config";

import { addFish } from "../../../features/game/gameSlice";
import { PLAYER_RENDER } from "../../../config/playerRender";

import { audioManager } from "../../../audio/audioManager";

import { randInt, makeId, clamp } from "./fish.utils";
import {
  fishBlockedBySidestep,
  cullInvisibleConflicts,
  hasTooCloseFishSameLane,
} from "./fish.spawnRules";

export default function FishLayer({
  fieldW,
  fieldH,
  scrollSpeedRef,
  worldOffsetRef,
  getObstacles, // должен вернуть массив obstacle snapshot (y = screenY)
  setFishSnapshotGetter,
}) {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);
  const runId = useSelector((s) => s.game.runId);

  const hostRef = useRef(null);
  const localOffsetRef = useRef(0);

  const fishRef = useRef([]);
  const lastTimeRef = useRef(0);

  const nextSpawnPxRef = useRef(
    randInt(FISH_CONFIG.SPAWN_GAP_PX.min, FISH_CONFIG.SPAWN_GAP_PX.max)
  );

  const [, bumpRender] = useState(0);

  useEffect(() => {
    fishRef.current = [];
    lastTimeRef.current = 0;
    localOffsetRef.current = 0;

    nextSpawnPxRef.current = randInt(
      FISH_CONFIG.SPAWN_GAP_PX.min,
      FISH_CONFIG.SPAWN_GAP_PX.max
    );

    if (hostRef.current) hostRef.current.style.transform = "translate3d(0px,0px,0px)";
    bumpRender((x) => x + 1);
  }, [runId]);

  function getOffsetFloat() {
    const shared = worldOffsetRef?.current;
    return typeof shared === "number" ? shared : localOffsetRef.current;
  }

  function getOffsetRenderPx() {
    return Math.round(getOffsetFloat());
  }

  useEffect(() => {
    if (!setFishSnapshotGetter) return;

    // ✅ наружу отдаём screenY, чтобы ObstacleLayer мог корректно проверять конфликты
    setFishSnapshotGetter(() => {
      return () => {
        const offset = getOffsetRenderPx();
        return fishRef.current.map((f) => ({
          id: f.id,
          lane: f.lane,
          y: f.y + offset, // screenY
          picked: f.picked,
          hidden: f.hidden,
        }));
      };
    });

    return () => setFishSnapshotGetter(() => []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFishSnapshotGetter]);

  const laneW = useMemo(() => fieldW / 5, [fieldW]);

  const laneCenters = useMemo(
    () => Array.from({ length: 5 }, (_, i) => laneW * (i + 0.5)),
    [laneW]
  );

  const fishScale = useMemo(() => {
    const s = (laneW * 0.85) / FISH_CONFIG.SIZE_PX;
    return clamp(s, 0.85, FISH_CONFIG.SCALE);
  }, [laneW]);

  // gap для sidestep-блокировки (как “воздух”)
  const screenType = useMemo(() => {
    const bp = FISH_CONFIG.SCREEN_BREAKPOINTS_PX ?? { mobileMax: 479, tabletMax: 899 };
    if (fieldW <= bp.mobileMax) return "mobile";
    if (fieldW <= bp.tabletMax) return "tablet";
    return "desktop";
  }, [fieldW]);

  const FISH_SIDESTEP_GAP_PX = useMemo(() => {
    const map = FISH_CONFIG.SIDESTEP_GAP_PX_BY_SCREEN ?? { desktop: 6, tablet: 5, mobile: 4 };
    return map[screenType] ?? map.desktop ?? 6;
  }, [screenType]);

  const pickupY = fieldH - PLAYER_RENDER.GROUND_BOTTOM_PX - 10;

  const POP_BASE_MS = 180;
  const POP_BASE_SPEED = 140;

  function computePopDurationMs() {
    const speed = scrollSpeedRef?.current ?? 0;
    const mult = clamp(speed / POP_BASE_SPEED, 0.75, 2.2);
    return Math.round(POP_BASE_MS / mult);
  }

  const SIDESTEP_LANE_RADIUS = 1;

  function isBlocked(lane, fishScreenY) {
    const fishSizePx = FISH_CONFIG.SIZE_PX * fishScale;

    return fishBlockedBySidestep({
      fishLane: lane,
      fishScreenY,
      getObstacles,
      laneW,
      fishSizePx,
      sidestepLaneRadius: SIDESTEP_LANE_RADIUS,
      sidestepGapPx: FISH_SIDESTEP_GAP_PX,
    });
  }

  function spawnFish(yWorld, nowMs) {
    const offsetFloat = getOffsetFloat();

    const fishSizePx = FISH_CONFIG.SIZE_PX * fishScale;
    const minLaneGapPx = FISH_CONFIG.MIN_LANE_GAP_PX ?? 52;

    for (let i = 0; i < 24; i++) {
      const lane = randInt(0, 4);
      const fishScreenY = yWorld + offsetFloat;

      if (isBlocked(lane, fishScreenY)) continue;

      if (
        hasTooCloseFishSameLane({
          fishList: fishRef.current,
          lane,
          yWorld,
          nowMs,
          minLaneGapPx,
          fishSizePx,
          popBaseMs: POP_BASE_MS,
        })
      ) {
        continue;
      }

      fishRef.current.push({
        id: makeId(),
        lane,
        x: laneCenters[lane],
        y: yWorld,
        picked: false,
        pickedAtMs: 0,
        popDurationMs: POP_BASE_MS,
        hidden: false,
      });

      return;
    }
  }

  function prewarm() {
    const offsetFloat = getOffsetFloat();
    for (let i = 0; i < 5; i++) {
      const screenY = -60 - i * 120;
      spawnFish(screenY - offsetFloat, performance.now());
    }
    nextSpawnPxRef.current = randInt(80, 140);
  }

  useEffect(() => {
    if (status !== "running") return;

    lastTimeRef.current = 0;
    if (!fishRef.current.length) prewarm();

    let raf = 0;

    function frame(t) {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;

      const speed = scrollSpeedRef?.current ?? 0;
      const dy = speed * dt;

      if (typeof worldOffsetRef?.current !== "number") {
        localOffsetRef.current += dy;
      }

      const offsetFloat = getOffsetFloat();
      const offsetPx = Math.round(offsetFloat);

      if (hostRef.current) {
        hostRef.current.style.transform = `translate3d(0px, ${offsetPx}px, 0px)`;
      }

      let mutated = false;

      // ✅ мягкая страховка, пока рыбы ещё не в кадре
      if (
        cullInvisibleConflicts({
          fishList: fishRef.current,
          offsetFloat,
          topVisibleScreenY: -40,
          isBlockedFn: isBlocked,
        })
      ) {
        mutated = true;
      }

      // pickup
      for (const f of fishRef.current) {
        if (f.hidden || f.picked) continue;

        const screenY = f.y + offsetFloat;

        if (
          Math.abs(screenY - pickupY) < FISH_CONFIG.PICKUP_WINDOW_PX &&
          f.lane === laneIndex
        ) {
          f.picked = true;
          f.pickedAtMs = t;
          f.popDurationMs = computePopDurationMs();

          audioManager.playSfx("fishPickup");
          dispatch(addFish(1));
          mutated = true;
        }
      }

      // remove
      const beforeLen = fishRef.current.length;
      fishRef.current = fishRef.current.filter((f) => {
        if (f.hidden) return false;
        if (f.picked) return t - f.pickedAtMs < f.popDurationMs;
        return f.y + offsetFloat < fieldH + 60;
      });
      if (fishRef.current.length !== beforeLen) mutated = true;

      // spawn
      nextSpawnPxRef.current -= dy;
      if (nextSpawnPxRef.current <= 0) {
        spawnFish(-40 - offsetFloat, t);

        nextSpawnPxRef.current = randInt(
          FISH_CONFIG.SPAWN_GAP_PX.min,
          FISH_CONFIG.SPAWN_GAP_PX.max
        );
        mutated = true;
      }

      if (mutated) bumpRender((x) => x + 1);

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status, laneIndex, fieldH, laneW, fishScale, laneCenters, FISH_SIDESTEP_GAP_PX]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 7, willChange: "transform" }}
    >
      {fishRef.current.map((f) => (
        <FishSprite
          key={f.id}
          src={FISH_CONFIG.IMAGE}
          x={f.x}
          y={f.y}
          sizePx={FISH_CONFIG.SIZE_PX}
          scale={fishScale}
          picked={f.picked}
          culled={f.hidden}
          popDurationMs={f.popDurationMs}
        />
      ))}
    </div>
  );
}
