import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ObstacleSprite from "./ObstacleSprite";
import { OBSTACLE_TYPES, OBSTACLES_CONFIG } from "./obstacles.config";
import { tryGameOver, triggerLunaSense } from "../../../features/game/gameSlice";
import { PLAYER_RENDER } from "../../../config/playerRender";

import { audioManager } from "../../../audio/audioManager";

import {
  fishConflict,
  laneHasEnoughGap,
  laneHasEnoughActionSwitchGap,
} from "./obstacles.spawnRules";

import { randInt, pickWeighted, makeId, normalizeTypeId } from "./obstacles.utils";


export default function ObstacleLayer({
  fieldW,
  fieldH,
  runId,
  scrollSpeedRef,
  worldOffsetRef,
  // ✅ единый rAF: слой не имеет своего requestAnimationFrame
  subscribeWorld,
  setObstacleSnapshotGetter,
  getFish,
}) {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);
  const actionState = useSelector((s) => s.game.actionState);
  const actionUntilMs = useSelector((s) => s.game.actionUntilMs ?? 0);

  // ✅ Luna only (cooldown gate живёт в gameSlice)
  const selectedCatId = useSelector((s) => s.game.selectedCatId);
  const lunaCooldownUntil = useSelector((s) => s.game.lunaSenseCooldownUntil ?? 0);

  const hostRef = useRef(null);
  const localOffsetRef = useRef(0);

  const obstaclesRef = useRef([]);
  const lastTimeRef = useRef(0);

  const nextSpawnPxRef = useRef(
    randInt(OBSTACLES_CONFIG.SPAWN_GAP_PX.min, OBSTACLES_CONFIG.SPAWN_GAP_PX.max)
  );

  const prevActionRef = useRef(actionState);

  const hitPlayedRef = useRef(false);

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

    // ✅ чтобы в начале забега трасса не была пустой:
    // первый спавн делаем заметно быстрее, чем обычный gap.
    // Дальше используется стандартный SPAWN_GAP_PX.
    const firstMin = Math.max(20, Math.floor(OBSTACLES_CONFIG.SPAWN_GAP_PX.min * 0.25));
    const firstMax = Math.max(
      firstMin + 10,
      Math.floor(OBSTACLES_CONFIG.SPAWN_GAP_PX.min * 0.55)
    );
    nextSpawnPxRef.current = randInt(firstMin, firstMax);

    if (hostRef.current) hostRef.current.style.transform = "translate3d(0px, 0px, 0px)";
    bumpRender((x) => x + 1);
    hitPlayedRef.current = false;
  }, [runId]);


  function spawnAtYWorld(yWorld) {
    const rawTypeId = pickWeighted(OBSTACLES_CONFIG.TYPE_WEIGHTS);
    if (!rawTypeId) return;

    const typeId = normalizeTypeId(rawTypeId);
    const type = OBSTACLE_TYPES[rawTypeId] ?? OBSTACLE_TYPES[typeId];
    if (!type) return;

    for (let i = 0; i < 16; i++) {
      const lane = randInt(0, 4);

      if (
        !laneHasEnoughGap({
          obstacles: obstaclesRef.current,
          lane,
          yWorld,
          minGapPx: OBSTACLES_CONFIG.SAME_LANE_MIN_GAP_PX,
        })
      ) continue;

      if (
        !laneHasEnoughActionSwitchGap({
          obstacles: obstaclesRef.current,
          lane,
          yWorld,
          type,
          actionSwitchMinGapPx: OBSTACLES_CONFIG.ACTION_SWITCH_MIN_GAP_PX,
        })
      ) continue;

      if (
        type.rule === "avoidLane" &&
        fishConflict({
          lane,
          yWorld,
          getOffsetPx: getOffsetRenderPx,
          getFish,
          rangePx: 420,
        })
      ) continue;

      const img = type.images[randInt(0, type.images.length - 1)];

      obstaclesRef.current.push({
        id: makeId(),
        lane,
        x: laneCenters[lane],
        y: yWorld,
        img,
        rule: type.rule,
        needAction: type.needAction,
        typeId,
        passed: false,
      });

      return;
    }
  }

  useEffect(() => {
    if (status !== "running") return;

    lastTimeRef.current = 0;

    const TIP_FAIL_WINDOW_MS = 45;

    const step = ({ dt, speed, worldOffsetPx }) => {
      const dy = (speed ?? 0) * (dt ?? 0);
      const offset = typeof worldOffsetPx === "number" ? worldOffsetPx : getOffsetRenderPx();

      const justLanded = prevActionRef.current === "jump" && actionState !== "jump";
      prevActionRef.current = actionState;

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
      const WARN_PX = 240;



      for (const o of obstaclesRef.current) {
        if (o.passed) continue;

        const screenY = o.y + offset;

        const hitWindow =
          o.needAction === "jump"
            ? (OBSTACLES_CONFIG.JUMP_HIT_WINDOW_PX ?? OBSTACLES_CONFIG.HIT_WINDOW_PX)
            : OBSTACLES_CONFIG.HIT_WINDOW_PX;

        // ✅ Если препятствие уже далеко позади — считаем пройденным
        if (screenY - playerHitY > hitWindow) {
          o.passed = true;
          continue;
        }

        // ✅ Luna warning — без изменений
        if (
          selectedCatId === "luna" &&
          o.lane === laneIndex &&
          (o.rule === "needAction" || o.rule === "avoidLane")
        ) {
          const now = Date.now();
          if (now >= lunaCooldownUntil) {
            const distAheadWarn = playerHitY - screenY;
            if (distAheadWarn > 0 && distAheadWarn < WARN_PX) {
              const isRealDanger =
                (o.rule === "needAction" && actionState !== o.needAction) ||
                (o.rule === "avoidLane");
              if (isRealDanger) dispatch(triggerLunaSense({ now }));
            }
          }
        }

        // Дальше работаем только если препятствие рядом с игроком
        if (Math.abs(screenY - playerHitY) < hitWindow) {
          const sameLane = o.lane === laneIndex;

          // -------- avoidLane (sidestep) --------
          if (o.rule === "avoidLane") {
            if (sameLane) {
              o.passed = true;
              if (!hitPlayedRef.current) {
                audioManager.playSfx("hit");
                hitPlayedRef.current = true;
              }
              dispatch(tryGameOver({ obstacleTypeId: o.typeId }));
              continue;
            }

            // игрок ушёл в другую lane — пометим passed когда препятствие дошло до уровня игрока/ниже
            if (screenY >= playerHitY) o.passed = true;
            continue;
          }

          // -------- needAction (jump/slide) --------
          if (o.rule === "needAction" && sameLane) {
            // не то действие -> смерть
            if (actionState !== o.needAction) {
              o.passed = true;
              if (!hitPlayedRef.current) {
                audioManager.playSfx("hit");
                hitPlayedRef.current = true;
              }
              dispatch(tryGameOver({ obstacleTypeId: o.typeId }));
              continue;
            }

            // правильное действие:
            if (o.needAction === "jump") {
              // "кончик" — только при приземлении и только если препятствие ещё чуть впереди
              const distAhead = playerHitY - screenY; // >=0 впереди
              const TIP_TIP_BAND_PX = 10;

              if (justLanded && distAhead >= 0 && distAhead <= TIP_TIP_BAND_PX) {
                o.passed = true;
                if (!hitPlayedRef.current) {
                  audioManager.playSfx("hit");
                  hitPlayedRef.current = true;
                }
                dispatch(tryGameOver({ obstacleTypeId: o.typeId }));
                continue;
              }

              // ✅ Ключевая штука: если мы в прыжке и препятствие дошло до уровня ног/ниже —
              // значит прыжок УЖЕ успешен. Ставим passed и НЕ даём умереть на выходе из jump.
              if (screenY >= playerHitY) {
                o.passed = true;
              }

              continue;
            }

            // slide: правильный слайд — можно сразу считать пройденным в окне
            o.passed = true;
            continue;
          }

          // needAction но в другой lane — не трогаем (пройдёт само по "позади")
        }
      }




      if (removed || spawned) bumpRender((x) => x + 1);
    };

    // ✅ Приоритет: единый rAF через subscribeWorld.
    if (typeof subscribeWorld === "function") {
      const unsubscribe = subscribeWorld((snap) => step(snap));
      return unsubscribe;
    }

    // --- fallback: локальный rAF ---
    let raf = 0;
    let last = performance.now();

    const frame = (t) => {
      const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
      last = t;

      const speed = scrollSpeedRef?.current ?? 0;
      const dy = speed * dt;

      if (!(typeof worldOffsetRef?.current === "number")) {
        localOffsetRef.current += dy;
      }

      step({ dt, speed, worldOffsetPx: getOffsetRenderPx() });
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [
    status,
    fieldH,
    laneIndex,
    actionState,
    actionUntilMs,
    scrollSpeedRef,
    worldOffsetRef,
    subscribeWorld,
    dispatch,
    selectedCatId,
    lunaCooldownUntil,
  ]);

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
