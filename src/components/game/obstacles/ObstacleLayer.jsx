import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ObstacleSprite from "./ObstacleSprite";
import { OBSTACLE_TYPES, OBSTACLES_CONFIG } from "./obstacles.config";
import { gameOver } from "../../../features/game/gameSlice";

import { ROAD_SCROLL_SPEED_PX_PER_SEC } from "../../../config/trackRoad";
import { PLAYER_RENDER } from "../../../config/playerRender";

// ---------------- utils ----------------
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
// ---------------------------------------

/**
 * ObstacleLayer
 * - генерирует препятствия
 * - двигает их вниз
 * - проверяет столкновения
 *
 * ✅ Важно для паузы:
 * На pause/resume мы НЕ сбрасываем obstaclesRef.
 * Prewarm делаем только когда стартует НОВАЯ попытка (runId изменился).
 */
export default function ObstacleLayer({
  fieldW,
  fieldH,
  runId, // ✅ NEW
  setObstacleSnapshotGetter,
}) {
  const dispatch = useDispatch();

  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);
  const actionState = useSelector((s) => s.game.actionState);

  const obstaclesRef = useRef([]);
  const lastTimeRef = useRef(0);

  // ✅ чтобы понимать, новая попытка или просто resume
  const runIdRef = useRef(runId);

  const nextSpawnPxRef = useRef(
    randInt(OBSTACLES_CONFIG.SPAWN_GAP_PX.min, OBSTACLES_CONFIG.SPAWN_GAP_PX.max)
  );

  const sameLaneRef = useRef({ lane: null, streak: 0 });
  const lastActionObstacleRef = useRef(null);

  const [, forceUpdate] = useState(0);

  const laneCenters = useMemo(() => {
    const laneW = fieldW / 5;
    return Array.from({ length: 5 }, (_, i) => laneW * (i + 0.5));
  }, [fieldW]);

  const playerHitY = useMemo(() => {
    const MINOR_OFFSET_PX = 10;
    return fieldH - PLAYER_RENDER.GROUND_BOTTOM_PX - MINOR_OFFSET_PX;
  }, [fieldH]);

  useEffect(() => {
    if (!setObstacleSnapshotGetter) return;
    setObstacleSnapshotGetter(() => () => obstaclesRef.current);
  }, [setObstacleSnapshotGetter]);

  function spawnAtY(y) {
    const typeId = pickWeighted(OBSTACLES_CONFIG.TYPE_WEIGHTS);
    const type = OBSTACLE_TYPES[typeId];

    // ✅ NEW:
    // Минимальный гэп в одной полосе.
    // Смысл: если подряд в одной lane появляются разные типы (например jump -> avoidLane),
    // игрок может физически "приземлиться" прямо в следующее препятствие.
    function laneHasEnoughGap(laneToCheck) {
      const minGap = OBSTACLES_CONFIG.SAME_LANE_MIN_GAP_PX ?? 0;
      if (minGap <= 0) return true;

      // Ищем ближайшее препятствие ВПЕРЕДИ (то есть которое ниже нового спавна)
      // в этой же полосе. Нам важна минимальная разница y.
      let nearestAheadY = null;
      for (const o of obstaclesRef.current) {
        if (o.lane !== laneToCheck) continue;
        if (o.y <= y) continue; // находится выше нового спавна → не мешает

        if (nearestAheadY == null || o.y < nearestAheadY) nearestAheadY = o.y;
      }

      if (nearestAheadY == null) return true;

      return nearestAheadY - y >= minGap;
    }

    let lane = randInt(0, 4);
    const memo = sameLaneRef.current;

    if (memo.lane === lane) memo.streak += 1;
    else {
      memo.lane = lane;
      memo.streak = 1;
    }

    if (memo.streak > OBSTACLES_CONFIG.MAX_SAME_LANE_STREAK) {
      lane = randInt(0, 4);
      memo.lane = lane;
      memo.streak = 1;
    }

    // ✅ NEW: пробуем подобрать lane так, чтобы соблюсти минимальный гэп в одной полосе.
    // Если не получилось — лучше пропустить этот спавн, чем создать "нечестную" ситуацию.
    let okLane = laneHasEnoughGap(lane);
    if (!okLane) {
      for (let tries = 0; tries < 10; tries++) {
        const candidate = randInt(0, 4);
        if (laneHasEnoughGap(candidate)) {
          lane = candidate;
          memo.lane = lane;
          memo.streak = 1;
          okLane = true;
          break;
        }
      }

      if (!okLane) {
        // чуть отодвигаем следующую попытку спавна
        nextSpawnPxRef.current = Math.max(nextSpawnPxRef.current, 80);
        return;
      }
    }

    const obstacle = {
      id: crypto.randomUUID(),
      lane,
      x: laneCenters[lane],
      y,
      img: type.images[randInt(0, type.images.length - 1)],
      rule: type.rule,
      needAction: type.needAction,
      passed: false,
    };

    obstaclesRef.current.push(obstacle);

    // защита от jump->slide впритык
    if (obstacle.rule === "needAction" && obstacle.needAction) {
      const prev = lastActionObstacleRef.current;

      if (prev && prev !== obstacle.needAction) {
        nextSpawnPxRef.current = Math.max(
          nextSpawnPxRef.current,
          OBSTACLES_CONFIG.ACTION_SWITCH_MIN_GAP_PX ?? 240
        );
      }

      lastActionObstacleRef.current = obstacle.needAction;
    }
  }

  function prewarm() {
    const count = 4;
    const gap = 160;

    for (let i = 0; i < count; i++) {
      spawnAtY(-60 - i * gap);
    }

    nextSpawnPxRef.current = randInt(90, 150);
  }

  useEffect(() => {
    if (status !== "running") return;

    // ✅ после паузы: сбрасываем только lastTime, чтобы не было “скачка”
    lastTimeRef.current = 0;

    // ✅ NEW: prewarm делаем только если началась НОВАЯ попытка
    if (runIdRef.current !== runId) {
      runIdRef.current = runId;

      // новая попытка — чистим всё состояние слоя
      obstaclesRef.current = [];
      nextSpawnPxRef.current = randInt(
        OBSTACLES_CONFIG.SPAWN_GAP_PX.min,
        OBSTACLES_CONFIG.SPAWN_GAP_PX.max
      );
      sameLaneRef.current = { lane: null, streak: 0 };
      lastActionObstacleRef.current = null;

      prewarm();
    } else {
      // тот же runId: это resume — ничего не пересоздаём
      // prewarm НЕ вызываем
    }

    let rafId;

    function frame(t) {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;

      const dy = ROAD_SCROLL_SPEED_PX_PER_SEC * dt;

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

        const hitY =
          Math.abs(o.y - playerHitY) <= OBSTACLES_CONFIG.HIT_WINDOW_PX;
        if (!hitY) continue;

        const sameLane = o.lane === laneIndex;

        if (o.rule === "needAction") {
          if (sameLane && actionState !== o.needAction) dispatch(gameOver());
        }

        if (o.rule === "avoidLane") {
          if (sameLane) dispatch(gameOver());
        }

        o.passed = true;
      }

      forceUpdate((x) => x + 1);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [
    status,
    fieldH,
    laneIndex,
    actionState,
    laneCenters,
    playerHitY,
    dispatch,
    runId,
  ]);

  const OBSTACLE_Z = 6;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: OBSTACLE_Z }}
    >
      {obstaclesRef.current.map((o) => (
        <ObstacleSprite
          key={o.id}
          src={o.img}
          x={o.x}
          y={o.y}
          sizePx={OBSTACLES_CONFIG.BASE_SIZE_PX}
          scale={OBSTACLES_CONFIG.SCALE}
          zIndex={OBSTACLE_Z}
        />
      ))}
    </div>
  );
}
