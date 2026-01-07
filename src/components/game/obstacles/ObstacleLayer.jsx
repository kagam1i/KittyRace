import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ObstacleSprite from "./ObstacleSprite";
import { OBSTACLE_TYPES, OBSTACLES_CONFIG } from "./obstacles.config";
import { gameOver } from "../../../features/game/gameSlice";
import { ROAD_SCROLL_SPEED_PX_PER_SEC } from "../../../config/trackRoad";
import { PLAYER_RENDER } from "../../../config/playerRender";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeighted(list) {
  const sum = list.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * sum;
  for (const x of list) {
    r -= x.w;
    if (r <= 0) return x.type;
  }
  return list[0].type;
}

export default function ObstacleLayer({
  fieldW,
  fieldH,
  runId,
  setObstacleSnapshotGetter,
  getFish, // ✅ НОВОЕ
}) {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);
  const actionState = useSelector((s) => s.game.actionState);

  const obstaclesRef = useRef([]);
  const lastTimeRef = useRef(0);
  const nextSpawnPxRef = useRef(
    randInt(
      OBSTACLES_CONFIG.SPAWN_GAP_PX.min,
      OBSTACLES_CONFIG.SPAWN_GAP_PX.max
    )
  );

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!setObstacleSnapshotGetter) return;
    setObstacleSnapshotGetter(() => obstaclesRef.current);
    return () => setObstacleSnapshotGetter(() => []);
  }, [setObstacleSnapshotGetter]);

  useEffect(() => {
    obstaclesRef.current = [];
    lastTimeRef.current = 0;
  }, [runId]);

  const laneCenters = useMemo(() => {
    const laneW = fieldW / 5;
    return Array.from({ length: 5 }, (_, i) => laneW * (i + 0.5));
  }, [fieldW]);

  const laneW = useMemo(() => fieldW / 5, [fieldW]);
  const maxScale = useMemo(() => {
    const s = (laneW * 0.9) / OBSTACLES_CONFIG.BASE_SIZE_PX;
    return Math.max(0.85, Math.min(OBSTACLES_CONFIG.SCALE, s));
  }, [laneW]);

  function fishConflict(lane, y) {
    const list = typeof getFish === "function" ? getFish() : [];
    return list.some(
      (f) =>
        !f.picked &&
        !f.hidden &&
        f.lane === lane &&
        Math.abs(f.y - y) < 420
    );
  }

  function spawnAtY(y) {
    const typeId = pickWeighted(OBSTACLES_CONFIG.TYPE_WEIGHTS);
    const type = OBSTACLE_TYPES[typeId];

    for (let i = 0; i < 16; i++) {
      const lane = randInt(0, 4);

      if (
        !laneHasEnoughGap(lane, y) ||
        !laneHasEnoughActionSwitchGap(lane, y, type)
      )
        continue;

      if (type.rule === "avoidLane" && fishConflict(lane, y)) continue;

      obstaclesRef.current.push({
        id: crypto.randomUUID(),
        lane,
        x: laneCenters[lane],
        y,
        img: type.images[randInt(0, type.images.length - 1)],
        rule: type.rule,
        needAction: type.needAction,
        passed: false,
      });
      return;
    }
  }

  function laneHasEnoughGap(lane, y) {
    return !obstaclesRef.current.some(
      (o) => o.lane === lane && Math.abs(o.y - y) < OBSTACLES_CONFIG.SAME_LANE_MIN_GAP_PX
    );
  }

  function laneHasEnoughActionSwitchGap(lane, y, type) {
    if (type.rule !== "needAction") return true;
    const next = obstaclesRef.current.find(
      (o) => o.lane === lane && o.y > y
    );
    if (!next || next.rule !== "needAction") return true;
    if (next.needAction === type.needAction) return true;
    return next.y - y >= OBSTACLES_CONFIG.ACTION_SWITCH_MIN_GAP_PX;
  }

  useEffect(() => {
    if (status !== "running") return;
    lastTimeRef.current = 0;

    let raf;
    function frame(t) {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dy =
        ((t - lastTimeRef.current) / 1000) *
        ROAD_SCROLL_SPEED_PX_PER_SEC;
      lastTimeRef.current = t;

      obstaclesRef.current.forEach((o) => (o.y += dy));
      obstaclesRef.current = obstaclesRef.current.filter(
        (o) => o.y < fieldH + 60
      );

      nextSpawnPxRef.current -= dy;
      if (nextSpawnPxRef.current <= 0) {
        spawnAtY(-40);
        nextSpawnPxRef.current = randInt(
          OBSTACLES_CONFIG.SPAWN_GAP_PX.min,
          OBSTACLES_CONFIG.SPAWN_GAP_PX.max
        );
      }

      for (const o of obstaclesRef.current) {
        if (o.passed) continue;
        if (Math.abs(o.y - (fieldH - PLAYER_RENDER.GROUND_BOTTOM_PX - 10)) < OBSTACLES_CONFIG.HIT_WINDOW_PX) {
          if (o.rule === "avoidLane" && o.lane === laneIndex) dispatch(gameOver());
          if (o.rule === "needAction" && o.lane === laneIndex && actionState !== o.needAction)
            dispatch(gameOver());
          o.passed = true;
        }
      }

      forceUpdate((x) => x + 1);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status, fieldH, laneIndex, actionState]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
      {obstaclesRef.current.map((o) => (
        <ObstacleSprite
          key={o.id}
          src={o.img}
          x={o.x}
          y={o.y}
          sizePx={OBSTACLES_CONFIG.BASE_SIZE_PX}
          scale={maxScale}
        />
      ))}
    </div>
  );
}
