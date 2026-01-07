import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import FishSprite from "./FishSprite";
import { FISH_CONFIG } from "./fish.config";

import { addFish } from "../../../features/game/gameSlice";
import { PLAYER_RENDER } from "../../../config/playerRender";
import { ROAD_SCROLL_SPEED_PX_PER_SEC } from "../../../config/trackRoad";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FishLayer({
  fieldW,
  fieldH,
  getObstacles,
  setFishSnapshotGetter, // ✅ НОВОЕ
}) {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);

  const fishRef = useRef([]);
  const lastTimeRef = useRef(0);
  const nextSpawnPxRef = useRef(
    randInt(FISH_CONFIG.SPAWN_GAP_PX.min, FISH_CONFIG.SPAWN_GAP_PX.max)
  );

  const [, forceUpdate] = useState(0);

  // 🔁 отдаём наружу актуальный список рыб
  useEffect(() => {
    if (!setFishSnapshotGetter) return;
    setFishSnapshotGetter(() => fishRef.current);
    return () => setFishSnapshotGetter(() => []);
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

  const AVOID_SPAWN_WINDOW_PX = 360;
  const PREHIDE_WINDOW_PX = 520;
  const REMOVE_AFTER_MS = 170;

  function getObstaclesSafe() {
    const raw = typeof getObstacles === "function" ? getObstacles() : [];
    return Array.isArray(raw) ? raw : [];
  }

  function hasSidestep(lane, y, win) {
    return getObstaclesSafe().some(
      (o) =>
        o.rule === "avoidLane" &&
        o.lane === lane &&
        Math.abs(o.y - y) < win
    );
  }

  function spawnFish(y) {
    for (let i = 0; i < 18; i++) {
      const lane = randInt(0, 4);
      if (hasSidestep(lane, y, AVOID_SPAWN_WINDOW_PX)) continue;

      fishRef.current.push({
        id: crypto.randomUUID(),
        lane,
        x: laneCenters[lane],
        y,
        picked: false,
        pickedAt: 0,
        hidden: false,
      });
      return;
    }
  }

  function prewarm() {
    for (let i = 0; i < 5; i++) spawnFish(-60 - i * 120);
    nextSpawnPxRef.current = randInt(80, 140);
  }

  useEffect(() => {
    if (status !== "running") return;
    lastTimeRef.current = 0;
    if (!fishRef.current.length) prewarm();

    let raf;
    function frame(t) {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;

      const dy = ROAD_SCROLL_SPEED_PX_PER_SEC * dt;

      fishRef.current.forEach((f) => (f.y += dy));

      // ❌ УБИРАЕМ ТОЛЬКО ВНЕ ЭКРАНА
      fishRef.current = fishRef.current.map((f) => {
        if (f.hidden || f.picked) return f;
        if (f.y < 0 && hasSidestep(f.lane, f.y, PREHIDE_WINDOW_PX)) {
          return { ...f, hidden: true };
        }
        return f;
      });

      for (const f of fishRef.current) {
        if (f.hidden || f.picked) continue;
        if (Math.abs(f.y - pickupY) < FISH_CONFIG.PICKUP_WINDOW_PX) {
          if (f.lane === laneIndex) {
            f.picked = true;
            f.pickedAt = t;
            dispatch(addFish(1));
          }
        }
      }

      fishRef.current = fishRef.current.filter((f) => {
        if (f.hidden) return false;
        if (f.picked) return t - f.pickedAt < REMOVE_AFTER_MS;
        return f.y < fieldH + 60;
      });

      nextSpawnPxRef.current -= dy;
      if (nextSpawnPxRef.current <= 0) {
        spawnFish(-40);
        nextSpawnPxRef.current = randInt(
          FISH_CONFIG.SPAWN_GAP_PX.min,
          FISH_CONFIG.SPAWN_GAP_PX.max
        );
      }

      forceUpdate((x) => x + 1);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status, fieldH, laneIndex, laneCenters, pickupY, dispatch, getObstacles]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 7 }}>
      {fishRef.current.map((f) => (
        <FishSprite
          key={f.id}
          src={FISH_CONFIG.IMAGE}
          x={f.x}
          y={f.y}
          sizePx={FISH_CONFIG.SIZE_PX}
          scale={maxFishScale}
          picked={f.picked}
        />
      ))}
    </div>
  );
}
