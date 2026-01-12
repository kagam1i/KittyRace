import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ObstacleSprite from "./ObstacleSprite";
import { OBSTACLE_TYPES, OBSTACLES_CONFIG } from "./obstacles.config";
import { gameOver } from "../../../features/game/gameSlice";
import { PLAYER_RENDER } from "../../../config/playerRender";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeighted(list) {
  const safe = Array.isArray(list) ? list : [];
  if (safe.length === 0) return null;

  const sum = safe.reduce((s, x) => s + (x?.w ?? 0), 0);
  if (sum <= 0) return safe[0]?.type ?? null;

  let r = Math.random() * sum;
  for (const x of safe) {
    r -= x.w;
    if (r <= 0) return x.type;
  }
  return safe[0].type;
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * ✅ Нормализация typeId для контракта снапшота:
 * FishLayer ожидает sidestep РОВНО как "sidestep".
 *
 * Если в конфиге/весах/старом коде встречаются варианты:
 * - "sideStep"
 * - "sidestep_left"
 * - "sidestepObstacle"
 * - и т.п.
 * мы приводим их к "sidestep".
 */
function normalizeTypeId(rawTypeId) {
  if (rawTypeId == null) return rawTypeId;

  const s = String(rawTypeId);
  const low = s.toLowerCase();

  // супер-консервативно: любые варианты с sidestep/side-step/side_step
  if (low.includes("sidestep")) return "sidestep";
  if (low.includes("side-step")) return "sidestep";
  if (low.includes("side_step")) return "sidestep";
  if (low.includes("sidestep")) return "sidestep";
  if (low === "sidestep") return "sidestep";

  // частый кейс camelCase
  if (low === "sidestep" || low === "sidestepobstacle" || low === "sidestepl") return "sidestep";

  // если вдруг было именно "sideStep"
  if (s === "sideStep") return "sidestep";

  return rawTypeId;
}

export default function ObstacleLayer({
  fieldW,
  fieldH,
  runId,
  scrollSpeedRef,
  worldOffsetRef,
  setObstacleSnapshotGetter,
  getFish,
}) {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);
  const actionState = useSelector((s) => s.game.actionState);

  const hostRef = useRef(null);
  const localOffsetRef = useRef(0);

  const obstaclesRef = useRef([]);
  const lastTimeRef = useRef(0);

  const nextSpawnPxRef = useRef(
    randInt(OBSTACLES_CONFIG.SPAWN_GAP_PX.min, OBSTACLES_CONFIG.SPAWN_GAP_PX.max)
  );

  const [, bumpRender] = useState(0);

  const laneCenters = useMemo(() => {
    const laneW = fieldW / 5;
    return Array.from({ length: 5 }, (_, i) => laneW * (i + 0.5));
  }, [fieldW]);

  const laneW = useMemo(() => fieldW / 5, [fieldW]);
  const maxScale = useMemo(() => {
    const s = (laneW * 0.9) / OBSTACLES_CONFIG.BASE_SIZE_PX;
    return Math.max(0.85, Math.min(OBSTACLES_CONFIG.SCALE, s));
  }, [laneW]);

  function getOffsetFloat() {
    const shared = worldOffsetRef?.current;
    if (typeof shared === "number") return shared;
    return localOffsetRef.current;
  }

  function getOffsetRenderPx() {
    return Math.round(getOffsetFloat());
  }

  useEffect(() => {
    if (!setObstacleSnapshotGetter) return;

    setObstacleSnapshotGetter(() => {
      return () => {
        const offset = getOffsetRenderPx();
        return obstaclesRef.current.map((o) => ({
          id: o.id,
          lane: o.lane,
          y: o.y + offset, // screenY
          rule: o.rule,
          needAction: o.needAction,
          // ✅ ВАЖНО: наружу всегда отдаём нормализованный typeId
          typeId: normalizeTypeId(o.typeId),
        }));
      };
    });

    return () => setObstacleSnapshotGetter(() => []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setObstacleSnapshotGetter]);

  useEffect(() => {
    obstaclesRef.current = [];
    lastTimeRef.current = 0;
    localOffsetRef.current = 0;

    nextSpawnPxRef.current = randInt(
      OBSTACLES_CONFIG.SPAWN_GAP_PX.min,
      OBSTACLES_CONFIG.SPAWN_GAP_PX.max
    );

    if (hostRef.current) hostRef.current.style.transform = "translate3d(0px, 0px, 0px)";
    bumpRender((x) => x + 1);
  }, [runId]);

  function getFishListSafe() {
    const list = typeof getFish === "function" ? getFish() : [];
    return Array.isArray(list) ? list : [];
  }

  function fishConflict(lane, yWorld) {
    const screenY = yWorld + getOffsetRenderPx();
    const fishList = getFishListSafe();

    return fishList.some((f) => {
      if (!f) return false;
      const fLane = f.lane ?? f.laneIndex;
      const fY = f.y;
      return (
        !f.picked &&
        !f.hidden &&
        fLane === lane &&
        typeof fY === "number" &&
        Math.abs(fY - screenY) < 420
      );
    });
  }

  function laneHasEnoughGap(lane, yWorld) {
    return !obstaclesRef.current.some(
      (o) => o.lane === lane && Math.abs(o.y - yWorld) < OBSTACLES_CONFIG.SAME_LANE_MIN_GAP_PX
    );
  }

  function laneHasEnoughActionSwitchGap(lane, yWorld, type) {
    if (type.rule !== "needAction") return true;

    const next = obstaclesRef.current.find((o) => o.lane === lane && o.y > yWorld);
    if (!next || next.rule !== "needAction") return true;
    if (next.needAction === type.needAction) return true;

    return next.y - yWorld >= OBSTACLES_CONFIG.ACTION_SWITCH_MIN_GAP_PX;
  }

  function spawnAtYWorld(yWorld) {
    const rawTypeId = pickWeighted(OBSTACLES_CONFIG.TYPE_WEIGHTS);
    if (!rawTypeId) return;

    // ✅ нормализуем сразу при создании (и в снапшоте тоже)
    const typeId = normalizeTypeId(rawTypeId);

    // ВАЖНО: тип в конфиге может храниться под сырьём (rawTypeId).
    // Поэтому сначала пытаемся найти по rawTypeId, потом по normalized.
    const type = OBSTACLE_TYPES[rawTypeId] ?? OBSTACLE_TYPES[typeId];
    if (!type) return;

    for (let i = 0; i < 16; i++) {
      const lane = randInt(0, 4);

      if (!laneHasEnoughGap(lane, yWorld)) continue;
      if (!laneHasEnoughActionSwitchGap(lane, yWorld, type)) continue;

      if (type.rule === "avoidLane" && fishConflict(lane, yWorld)) continue;

      const img = type.images[randInt(0, type.images.length - 1)];

      obstaclesRef.current.push({
        id: makeId(),
        lane,
        x: laneCenters[lane],
        y: yWorld,
        img,
        rule: type.rule,
        needAction: type.needAction,
        typeId, // ✅ кладём нормализованный
        passed: false,
      });

      return;
    }
  }

  useEffect(() => {
    if (status !== "running") return;

    lastTimeRef.current = 0;

    let raf = 0;

    const frame = (t) => {
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

      const beforeLen = obstaclesRef.current.length;
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.y + offset < fieldH + 60);
      const removed = obstaclesRef.current.length !== beforeLen;

      nextSpawnPxRef.current -= dy;
      let spawned = false;

      if (nextSpawnPxRef.current <= 0) {
        const yWorld = -40 - offset;
        spawnAtYWorld(yWorld);

        nextSpawnPxRef.current = randInt(
          OBSTACLES_CONFIG.SPAWN_GAP_PX.min,
          OBSTACLES_CONFIG.SPAWN_GAP_PX.max
        );

        spawned = true;
      }

      const playerHitY = fieldH - PLAYER_RENDER.GROUND_BOTTOM_PX - 10;

      for (const o of obstaclesRef.current) {
        if (o.passed) continue;

        const screenY = o.y + offset;

        const hitWindow =
          o.needAction === "jump"
            ? (OBSTACLES_CONFIG.JUMP_HIT_WINDOW_PX ?? OBSTACLES_CONFIG.HIT_WINDOW_PX)
            : OBSTACLES_CONFIG.HIT_WINDOW_PX;

        if (Math.abs(screenY - playerHitY) < hitWindow) {
          if (o.rule === "needAction" && o.lane === laneIndex && actionState !== o.needAction) {
            dispatch(gameOver());
          }
          if (o.rule === "needAction" && o.lane === laneIndex && actionState !== o.needAction)
            dispatch(gameOver());
          o.passed = true;
        }
      }

      if (removed || spawned) bumpRender((x) => x + 1);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status, fieldH, laneIndex, actionState, scrollSpeedRef, worldOffsetRef, dispatch]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 6, willChange: "transform" }}
    >
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
