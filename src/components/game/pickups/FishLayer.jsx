import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import FishSprite from "./FishSprite";
import { FISH_CONFIG } from "./fish.config";

// Используем размеры препятствий из конфига,
// чтобы проверка "рыба НЕ на obstacle" была в той же системе координат.
import { OBSTACLES_CONFIG } from "../obstacles/obstacles.config";

import { addFish } from "../../../features/game/gameSlice";
import { PLAYER_RENDER } from "../../../config/playerRender";

// ---------------- utils ----------------
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// ---------------------------------------

/**
 * FishLayer
 * - генерирует рыбы на дорожке
 * - двигает вниз
 * - даёт подобрать игроку
 *
 * ✅ getObstacles:
 * Функция, которая возвращает текущие препятствия.
 * Мы используем это, чтобы рыба НЕ появлялась на “опасных” препятствиях avoidLane.
 */
export default function FishLayer({ fieldW, fieldH, getObstacles }) {
  const dispatch = useDispatch();

  const status = useSelector((s) => s.game.status);
  const laneIndex = useSelector((s) => s.game.laneIndex);

  const fishRef = useRef([]);
  const lastTimeRef = useRef(0);

  // сколько пикселей “проехать” до следующей рыбы
  const nextSpawnPxRef = useRef(
    randInt(FISH_CONFIG.SPAWN_GAP_PX.min, FISH_CONFIG.SPAWN_GAP_PX.max)
  );

  const [, forceUpdate] = useState(0);

  // центры 5 полос в px внутри дороги
  const laneCenters = useMemo(() => {
    const laneW = fieldW / 5;
    return Array.from({ length: 5 }, (_, i) => laneW * (i + 0.5));
  }, [fieldW]);

  // линия подбора игрока по Y (снизу)
  const playerPickupY = useMemo(() => {
    const MINOR_OFFSET_PX = 10;
    return fieldH - PLAYER_RENDER.GROUND_BOTTOM_PX - MINOR_OFFSET_PX;
  }, [fieldH]);

  // ✅ NEW:
  // Вместо "окна по центрам" используем пересечение хитбоксов по Y.
  // Так рыба гарантированно не окажется "на" avoidLane препятствии.
  //
  // Мы не берём точные размеры спрайтов (чтобы не усложнять),
  // а используем честные приближённые half-height'ы.
  const FISH_HALF_H_PX = Math.round(
    ((FISH_CONFIG.SIZE_PX * (FISH_CONFIG.SCALE ?? 1)) / 2) * 0.8
  );

  // avoidLane препятствия визуально крупнее рыбы.
  // Берём логический размер из obstacles.config (BASE_SIZE_PX * SCALE),
  // иначе можно недооценить размер и “пропустить” пересечение.
  const AVOID_HALF_H_PX = Math.round(
    (OBSTACLES_CONFIG.BASE_SIZE_PX * OBSTACLES_CONFIG.SCALE) / 2
  );

  // небольшой “воздух”, чтобы не выглядело как наложение
  const AVOID_PADDING_PX = 10;

  function isLaneBlockedByAvoidObstacle(lane, fishY) {
    const obstaclesRaw =
      typeof getObstacles === "function" ? getObstacles() : [];
    const obstacles = Array.isArray(obstaclesRaw) ? obstaclesRaw : [];

    for (const o of obstacles) {
      if (o.rule !== "avoidLane") continue;
      if (o.lane !== lane) continue;

      // ✅ Проверяем пересечение по Y как у двух прямоугольников:
      // overlap, если расстояние между центрами меньше суммы half-heights (+ padding)
      const overlapY =
        Math.abs(o.y - fishY) <
        FISH_HALF_H_PX + AVOID_HALF_H_PX + AVOID_PADDING_PX;

      if (overlapY) return true;
    }

    return false;
  }

  function spawnFishAtY(y) {
    // Пытаемся найти “свободную” полосу.
    // Важно: делаем несколько попыток и, если не вышло, просто пропускаем спавн.
    let lane = randInt(0, 4);

    let ok = false;
    for (let tries = 0; tries < 7; tries++) {
      lane = randInt(0, 4);

      if (!isLaneBlockedByAvoidObstacle(lane, y)) {
        ok = true;
        break;
      }
    }

    if (!ok) return;

    fishRef.current.push({
      id: crypto.randomUUID(),
      lane,
      x: laneCenters[lane],
      y,
      picked: false,
    });
  }

  // ✅ Дополнительная защита:
  // даже если рыба заспавнилась "чуть раньше", чем obstacle (в том же кадре),
  // мы не хотим видеть наложение. Поэтому на каждом кадре удаляем рыб,
  // которые оказались на avoidLane препятствии.
  function filterFishNotOnAvoidObstacles(list) {
    return list.filter((f) => !isLaneBlockedByAvoidObstacle(f.lane, f.y));
  }

  // prewarm — чтобы при старте поле не было пустым
  function prewarm() {
    const count = 5;
    const gap = 120;

    for (let i = 0; i < count; i++) {
      spawnFishAtY(-40 - i * gap);
    }

    nextSpawnPxRef.current = randInt(60, 120);
  }

  useEffect(() => {
    if (status !== "running") return;

    // после паузы/резюма: сбрасываем только время, чтобы не было “скачка”
    lastTimeRef.current = 0;

    // prewarm только если рыб ещё нет (старт новой попытки / первый старт)
    // ⚠️ на pause/resume массив НЕ очищается, значит prewarm не вызовется => всё продолжится.
    if (fishRef.current.length === 0) {
      prewarm();
    }

    let rafId;

    function frame(t) {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;

      const dy = FISH_CONFIG.SPEED_PX_PER_SEC * dt;

      // 1) движение вниз
      fishRef.current.forEach((f) => (f.y += dy));

      // 1.1) ✅ убираем рыбы, которые "оказались" на avoidLane препятствиях
      // (страховка от ситуации, когда obstacle появился сразу после спавна рыбы)
      fishRef.current = filterFishNotOnAvoidObstacles(fishRef.current);

      // 2) чистим ушедшие вниз и подобранные
      fishRef.current = fishRef.current.filter(
        (f) => !f.picked && f.y < fieldH + 60
      );

      // 3) спавн по расстоянию
      nextSpawnPxRef.current -= dy;
      if (nextSpawnPxRef.current <= 0) {
        spawnFishAtY(-30);
        nextSpawnPxRef.current = randInt(
          FISH_CONFIG.SPAWN_GAP_PX.min,
          FISH_CONFIG.SPAWN_GAP_PX.max
        );
      }

      // 4) подбор
      for (const f of fishRef.current) {
        if (f.picked) continue;

        const hitY =
          Math.abs(f.y - playerPickupY) <= FISH_CONFIG.PICKUP_WINDOW_PX;
        if (!hitY) continue;

        if (f.lane === laneIndex) {
          f.picked = true;
          dispatch(addFish(1));
        }
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
    laneCenters,
    playerPickupY,
    dispatch,
    getObstacles,
  ]);

  const FISH_Z = 7;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: FISH_Z }}
    >
      {fishRef.current.map((f) => (
        <FishSprite
          key={f.id}
          src={FISH_CONFIG.IMAGE}
          x={f.x}
          y={f.y}
          sizePx={FISH_CONFIG.SIZE_PX}
          scale={FISH_CONFIG.SCALE}
          picked={f.picked} // ✅ триггер pop-эффекта
          zIndex={FISH_Z}
        />
      ))}
    </div>
  );
}
