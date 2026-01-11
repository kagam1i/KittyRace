import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import FishSprite from "./FishSprite";
import { FISH_CONFIG } from "./fish.config";

import { addFish } from "../../../features/game/gameSlice";
import { PLAYER_RENDER } from "../../../config/playerRender";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export default function FishLayer({
  fieldW,
  fieldH,
  scrollSpeedRef,
  worldOffsetRef,
  getObstacles,
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

    if (hostRef.current) hostRef.current.style.transform = "translate3d(0px, 0px, 0px)";
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
        return fishRef.current.map((f) => ({ ...f, y: f.y + offset }));
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

  const maxFishScale = useMemo(() => {
    const s = (laneW * 0.85) / FISH_CONFIG.SIZE_PX;
    return Math.max(0.85, Math.min(FISH_CONFIG.SCALE, s));
  }, [laneW]);

  const pickupY = useMemo(
    () => fieldH - PLAYER_RENDER.GROUND_BOTTOM_PX - 10,
    [fieldH]
  );

  const PREHIDE_WINDOW_PX = 520;

  const POP_BASE_MS = 180;
  const POP_BASE_SPEED = 140;

  // ✅ пиксельный “зазор безопасности”, чтобы рыба никогда не касалась sidestep
  const SAFE_MARGIN_PX = 6;

  function getObstaclesSafe() {
    const raw = typeof getObstacles === "function" ? getObstacles() : [];
    return Array.isArray(raw) ? raw : [];
  }

  function computePopDurationMs() {
    const speed = scrollSpeedRef?.current ?? 0;
    const mult = clamp(speed / POP_BASE_SPEED, 0.75, 2.2);
    return Math.round(POP_BASE_MS / mult);
  }

  // ✅ Проверка “рыба пересекается с sidestep по прямоугольникам”
  // Мы работаем в экранных координатах.
  function fishOverlapsSidestep(lane, fishScreenY) {
    // Размер рыбы по высоте в пикселях экрана
    const fishH = FISH_CONFIG.SIZE_PX * maxFishScale;
    const fishTop = fishScreenY - fishH / 2;
    const fishBot = fishScreenY + fishH / 2;

    // Размер sidestep по высоте.
    // У препятствий у тебя обычно scale = OBSTACLES_CONFIG.SCALE (2),
    // а base size = 32. Это даёт ~64px высоты.
    // Если потом поменяешь scale — всё равно будет работать.
    const SIDESTEP_BASE_SIZE_PX = 32;
    const SIDESTEP_SCALE = 2;
    const sidestepH = SIDESTEP_BASE_SIZE_PX * SIDESTEP_SCALE;

    const list = getObstaclesSafe();

    for (const o of list) {
      if (!o) continue;
      if (o.lane !== lane) continue;
      if (o.typeId !== "sidestep") continue;

      const sY = o.y; // уже screenY из snapshot
      const sTop = sY - sidestepH / 2;
      const sBot = sY + sidestepH / 2;

      // расширяем прямоугольник sidestep на SAFE_MARGIN_PX
      const sTopSafe = sTop - SAFE_MARGIN_PX;
      const sBotSafe = sBot + SAFE_MARGIN_PX;

      const intersects = fishBot > sTopSafe && fishTop < sBotSafe;
      if (intersects) return true;
    }

    return false;
  }

  function spawnFish(yWorld) {
    const offset = getOffsetRenderPx();

    for (let i = 0; i < 18; i++) {
      const lane = randInt(0, 4);
      const fishScreenY = yWorld + offset;

      // ✅ точный геометрический запрет: не пересекаемся с sidestep
      if (fishOverlapsSidestep(lane, fishScreenY)) continue;

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
    const offset = getOffsetRenderPx();
    for (let i = 0; i < 5; i++) {
      const screenY = -60 - i * 120;
      const yWorld = screenY - offset;
      spawnFish(yWorld);
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

      if (!(typeof worldOffsetRef?.current === "number")) {
        localOffsetRef.current += dy;
      }

      const offset = getOffsetRenderPx();

      if (hostRef.current) {
        hostRef.current.style.transform = `translate3d(0px, ${offset}px, 0px)`;
      }

      let mutated = false;

      // prehide: если рыба ещё выше кадра, но она бы пересеклась с sidestep — прячем
      fishRef.current = fishRef.current.map((f) => {
        if (f.hidden || f.picked) return f;

        const fishScreenY = f.y + offset;

        if (fishScreenY < 0 && fishOverlapsSidestep(f.lane, fishScreenY)) {
          mutated = true;
          return { ...f, hidden: true };
        }

        return f;
      });

      // pickup
      for (const f of fishRef.current) {
        if (f.hidden || f.picked) continue;

        const screenY = f.y + offset;

        if (
          Math.abs(screenY - pickupY) < FISH_CONFIG.PICKUP_WINDOW_PX &&
          f.lane === laneIndex
        ) {
          f.picked = true;
          f.pickedAtMs = t;
          f.popDurationMs = computePopDurationMs();

          dispatch(addFish(1));
          mutated = true;
        }
      }

      // remove: исчезновение ровно по длительности pop
      const beforeLen = fishRef.current.length;
      fishRef.current = fishRef.current.filter((f) => {
        if (f.hidden) return false;

        if (f.picked) {
          const aliveMs = t - (f.pickedAtMs || 0);
          return aliveMs < (f.popDurationMs || POP_BASE_MS);
        }

        return f.y + offset < fieldH + 60;
      });

      // spawn
      nextSpawnPxRef.current -= dy;
      if (nextSpawnPxRef.current <= 0) {
        spawnFish(-40 - offset);

        nextSpawnPxRef.current = randInt(
          FISH_CONFIG.SPAWN_GAP_PX.min,
          FISH_CONFIG.SPAWN_GAP_PX.max
        );
        mutated = true;
      }

      if (mutated || fishRef.current.length !== beforeLen) {
        bumpRender((x) => x + 1);
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [
    status,
    fieldH,
    laneIndex,
    laneCenters,
    pickupY,
    dispatch,
    getObstacles,
    scrollSpeedRef,
    worldOffsetRef,
    maxFishScale,
  ]);

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
          scale={maxFishScale}
          picked={f.picked}
          culled={f.hidden}
          popDurationMs={f.popDurationMs || 180}
        />
      ))}
    </div>
  );
}
