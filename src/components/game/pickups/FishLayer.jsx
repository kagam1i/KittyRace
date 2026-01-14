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

import { getObstacleBoundsPx } from "../obstacles/obstacleBounds";

export default function FishLayer({
  fieldW,
  fieldH,
  scrollSpeedRef,
  worldOffsetRef,
  subscribeWorld,
  getObstacles, // obstacle snapshot: { typeId, lane, y(screenPx), ... }
  setFishSnapshotGetter,
}) {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);
  const runId = useSelector((s) => s.game.runId);
  const actionState = useSelector((s) => s.game.actionState);

  // 2 слоя, чтобы можно было рисовать рыбу "под slide"
  const hostUnderRef = useRef(null);
  const hostOverRef = useRef(null);

  const localOffsetRef = useRef(0);

  const fishRef = useRef([]);
  const nextSpawnPxRef = useRef(
    randInt(FISH_CONFIG.SPAWN_GAP_PX.min, FISH_CONFIG.SPAWN_GAP_PX.max)
  );

  const [, bumpRender] = useState(0);

  useEffect(() => {
    fishRef.current = [];
    localOffsetRef.current = 0;

    nextSpawnPxRef.current = randInt(
      FISH_CONFIG.SPAWN_GAP_PX.min,
      FISH_CONFIG.SPAWN_GAP_PX.max
    );

    if (hostUnderRef.current)
      hostUnderRef.current.style.transform = "translate3d(0px,0px,0px)";
    if (hostOverRef.current)
      hostOverRef.current.style.transform = "translate3d(0px,0px,0px)";

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

  const screenType = useMemo(() => {
    const bp = FISH_CONFIG.SCREEN_BREAKPOINTS_PX ?? { mobileMax: 479, tabletMax: 899 };
    if (fieldW <= bp.mobileMax) return "mobile";
    if (fieldW <= bp.tabletMax) return "tablet";
    return "desktop";
  }, [fieldW]);

  const FISH_SIDESTEP_GAP_PX = useMemo(() => {
    const map = FISH_CONFIG.SIDESTEP_GAP_PX_BY_SCREEN ?? {
      desktop: 6,
      tablet: 5,
      mobile: 4,
    };
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

  function fishOverlapsSolidObstacleBounds({ lane, fishScreenY }) {
    if (typeof getObstacles !== "function") return false;

    const obstacles = getObstacles();
    if (!Array.isArray(obstacles) || obstacles.length === 0) return false;

    const fishSizePx = FISH_CONFIG.SIZE_PX * fishScale;
    const fishHalf = fishSizePx / 2;

    const fishTop = fishScreenY - fishHalf;
    const fishBottom = fishScreenY + fishHalf;

    // небольшой паддинг для стабильности пиксель-арта
    const PAD_PX = 2;

    for (const o of obstacles) {
      if (!o) continue;
      if (o.lane !== lane) continue;
      if (typeof o.y !== "number") continue;

      // slide НЕ блокируем: для него есть underSlide
      if (o.typeId === "slide") continue;

      const b = getObstacleBoundsPx({ typeId: o.typeId, laneW, yPx: o.y });

      const top = Math.round(b.top) - PAD_PX;
      const bottom = Math.round(b.bottom) + PAD_PX;

      if (fishBottom > top && fishTop < bottom) return true;
    }

    return false;
  }

  function isBlocked(lane, fishScreenY) {
    const fishSizePx = FISH_CONFIG.SIZE_PX * fishScale;

    if (
      fishBlockedBySidestep({
        fishLane: lane,
        fishScreenY,
        getObstacles,
        laneW,
        fishSizePx,
        sidestepLaneRadius: SIDESTEP_LANE_RADIUS,
        sidestepGapPx: FISH_SIDESTEP_GAP_PX,
      })
    ) {
      return true;
    }

    // не спавним рыбу внутри “твёрдых” препятствий (камни/jump и т.п.)
    if (fishOverlapsSolidObstacleBounds({ lane, fishScreenY })) {
      return true;
    }

    return false;
  }

  // underSlide считаем в момент спавна (screen координаты),
  // чтобы рыба сразу попадала в нужный слой и НЕ "перескакивала" кадром позже.
  function computeUnderSlideAtSpawn({ lane, yWorld, offsetPx }) {
    if (typeof getObstacles !== "function") return false;
    const obstacles = getObstacles();
    if (!Array.isArray(obstacles) || obstacles.length === 0) return false;

    const fishSizePx = FISH_CONFIG.SIZE_PX * fishScale;
    const fishHalf = fishSizePx / 2;

    const fishScreenY = yWorld + offsetPx;
    const fishTop = fishScreenY - fishHalf;
    const fishBottom = fishScreenY + fishHalf;

    // чуть расширим bounds, чтобы пиксель-арт выглядел стабильно
    const SLIDE_PAD_PX = 2;

    for (const o of obstacles) {
      if (!o || o.typeId !== "slide") continue;
      if (o.lane !== lane) continue;
      if (typeof o.y !== "number") continue;

      const b = getObstacleBoundsPx({ typeId: o.typeId, laneW, yPx: o.y });

      const top = Math.round(b.top) - SLIDE_PAD_PX;
      const bottom = Math.round(b.bottom) + SLIDE_PAD_PX;

      if (fishBottom > top && fishTop < bottom) return true;
    }

    return false;
  }

  function spawnFish(yWorld, nowMs) {
    const offsetFloat = getOffsetFloat();
    const offsetPx = Math.round(offsetFloat);

    const fishSizePx = FISH_CONFIG.SIZE_PX * fishScale;
    const minLaneGapPx = FISH_CONFIG.MIN_LANE_GAP_PX ?? 52;

    for (let i = 0; i < 24; i++) {
      const lane = randInt(0, 4);
      const fishScreenY = yWorld + offsetPx;

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

      const underSlide = computeUnderSlideAtSpawn({ lane, yWorld, offsetPx });

      fishRef.current.push({
        id: makeId(),
        lane,
        x: laneCenters[lane],
        y: yWorld,
        picked: false,
        pickedAtMs: 0,
        popDurationMs: POP_BASE_MS,
        hidden: false,
        underSlide,
      });

      return;
    }
  }

  function prewarm() {
    const offsetFloat = getOffsetFloat();
    const now = performance.now();

    for (let i = 0; i < 5; i++) {
      const screenY = -60 - i * 120;
      spawnFish(screenY - offsetFloat, now);
    }

    nextSpawnPxRef.current = randInt(80, 140);
  }

  useEffect(() => {
    if (status !== "running") return;

    if (!fishRef.current.length) prewarm();

    const step = ({ t, dt, speed, worldOffsetPx }) => {
      const dy = (speed ?? 0) * (dt ?? 0);

      if (typeof worldOffsetRef?.current !== "number") {
        localOffsetRef.current += dy;
      }

      const offsetFloat =
        typeof worldOffsetPx === "number" ? worldOffsetPx : getOffsetFloat();
      const offsetPx = Math.round(offsetFloat);

      if (hostUnderRef.current) {
        hostUnderRef.current.style.transform = `translate3d(0px, ${offsetPx}px, 0px)`;
      }
      if (hostOverRef.current) {
        hostOverRef.current.style.transform = `translate3d(0px, ${offsetPx}px, 0px)`;
      }

      let mutated = false;

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

      for (const f of fishRef.current) {
        if (f.hidden || f.picked) continue;

        const screenY = f.y + offsetPx;

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

      const beforeLen = fishRef.current.length;
      fishRef.current = fishRef.current.filter((f) => {
        if (f.hidden) return false;
        if (f.picked) return t - f.pickedAtMs < f.popDurationMs;
        return f.y + offsetFloat < fieldH + 60;
      });
      if (fishRef.current.length !== beforeLen) mutated = true;

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
    };

    if (typeof subscribeWorld === "function") {
      const unsubscribe = subscribeWorld((snap) => step(snap));
      return unsubscribe;
    }

    return undefined;
  }, [
    status,
    laneIndex,
    fieldH,
    laneW,
    fishScale,
    laneCenters,
    FISH_SIDESTEP_GAP_PX,
    subscribeWorld,
    dispatch,
    scrollSpeedRef,
    worldOffsetRef,
    getObstacles,
  ]);

  // оставляем рыбу выше препятствий даже во время slide
  const fishZUnder = 5;
  const fishZOver = 7;

  return (
    <>
      <div
        ref={hostUnderRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: fishZUnder, willChange: "transform" }}
      >
        {fishRef.current
          .filter((f) => f?.underSlide)
          .map((f) => (
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

      <div
        ref={hostOverRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: fishZOver, willChange: "transform" }}
      >
        {fishRef.current
          .filter((f) => !f?.underSlide)
          .map((f) => (
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
    </>
  );
}
