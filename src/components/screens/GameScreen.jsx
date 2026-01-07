// src/components/screens/GameScreen.jsx
//
// GameScreen — экран "running":
// 1) Рисуем квадратное игровое поле
// 2) Слои внутри дороги:
//    - TrackRoad (фон дороги)
//    - ObstacleLayer (препятствия)
//    - FishLayer (рыбки, которые можно собирать)
//    - LaneGrid (тонкие линии полос — чисто визуально)
//    - PlayerActor (котик)
// 3) Слева/справа — TrackShoulder (обочины + декор внутри).
//
// ✅ Важно про паузу:
// - На pause/resume мы НЕ должны перемонтировать ObstacleLayer/FishLayer,
//   иначе их внутреннее состояние (refs) сбросится.
// - Поэтому тут НЕТ key={runId} на слоях.
// - Полный рестарт делается через runId внутри слоёв.
//
// ✅ Важно про fish <-> sidestep:
// - FishLayer НЕ должен “в кадре” резко удалять рыбу из-за sidestep.
// - Чтобы этого не было, мы запрещаем ObstacleLayer спавнить sidestep
//   рядом с уже существующими рыбами.
// - Для этого FishLayer отдаёт наружу getter рыб,
//   а ObstacleLayer получает getFish.

import { useDispatch, useSelector } from "react-redux";
import { useRef } from "react";

import { TrackRoad } from "../game/TrackRoad";
import { TrackShoulder } from "../game/TrackShoulders";

import ObstacleLayer from "../game/obstacles/ObstacleLayer";
import FishLayer from "../game/pickups/FishLayer";

import { pauseGame } from "../../features/game/gameSlice";

import { SHOULDER_STRIP_PERCENT } from "../../config/trackRoad";

import { useSquareFieldSize } from "./gameScreen/useSquareFieldSize";
import { useGameControls } from "./gameScreen/useGameControls";

import GameHud from "./gameScreen/GameHud";
import LaneGrid from "./gameScreen/LaneGrid";
import PlayerActor from "./gameScreen/PlayerActor";

export function GameScreen() {
  const dispatch = useDispatch();

  // --- Redux state ---
  const laneIndex = useSelector((s) => s.game.laneIndex);
  const actionState = useSelector((s) => s.game.actionState);
  const selectedCatId = useSelector((s) => s.game.selectedCatId);

  // runId меняется ТОЛЬКО на новый забег (start/restart),
  // на pause/resume оставляем тем же.
  const runId = useSelector((s) => s.game.runId);

  // --- Размер поля ---
  const { fieldRef, fieldPx } = useSquareFieldSize();

  // --- Управление (клавиатура + swipe на поле) ---
  useGameControls(fieldRef);

  // ✅ Getter препятствий (FishLayer использует, чтобы не спавнить рыбу на avoidLane)
  const obstaclesGetterRef = useRef(() => []);

  // ✅ Getter рыб (ObstacleLayer использует, чтобы не спавнить sidestep рядом с рыбой)
  const fishGetterRef = useRef(() => []);

  // ширина центральной дороги (без обочин)
  const roadW = Math.floor(
    fieldPx * (1 - (SHOULDER_STRIP_PERCENT * 2) / 100)
  );

  return (
    <div className="min-h-[100svh] bg-bg grid place-items-center p-3 sm:p-6">
      {/* Обёртка: держим HUD “приклеенным” к полю */}
      <div
        className="relative w-full"
        // ✅ адаптив: поле не должно вылезать за экран по высоте на мобилке
        style={{ width: "min(640px, 96vw, calc(100svh - 160px))" }}
      >
        <GameHud onMenuClick={() => dispatch(pauseGame())} />

        {/* Игровое поле */}
        <div
          ref={fieldRef}
          className="relative w-full aspect-square rounded-none bg-bg border border-border shadow-soft overflow-hidden"
          // ✅ важно для touch: свайпы не конфликтуют со скроллом/зумом страницы
          style={{ touchAction: "none" }}
        >
          {/* Делим поле: обочина | дорога | обочина */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `${SHOULDER_STRIP_PERCENT}% ${
                100 - SHOULDER_STRIP_PERCENT * 2
              }% ${SHOULDER_STRIP_PERCENT}%`,
            }}
          >
            {/* Левая обочина */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && <TrackShoulder fieldPx={fieldPx} side="left" />}
            </div>

            {/* Центр: дорога + слои */}
            <div className="relative overflow-hidden">
              {/* Фон дороги */}
              {fieldPx > 0 && <TrackRoad fieldPx={roadW} />}

              {/* Препятствия */}
              {fieldPx > 0 && (
                <ObstacleLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  runId={runId}
                  // ✅ чтобы sidestep не спавнился рядом с рыбой (и рыбы не “исчезали”)
                  getFish={() => fishGetterRef.current()}
                  // ✅ наружу отдаём getter препятствий (для FishLayer)
                  setObstacleSnapshotGetter={(getter) => {
                    obstaclesGetterRef.current = getter;
                  }}
                />
              )}

              {/* Рыбы */}
              {fieldPx > 0 && (
                <FishLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  // ✅ рыбы не спавнятся на avoidLane
                  getObstacles={() => obstaclesGetterRef.current()}
                  // ✅ наружу отдаём getter рыб (для ObstacleLayer)
                  setFishSnapshotGetter={(getter) => {
                    fishGetterRef.current = getter;
                  }}
                />
              )}

              {/* Линии полос (визуально) */}
              <LaneGrid />

              {/* Игрок */}
              <PlayerActor
                laneIndex={laneIndex}
                actionState={actionState}
                selectedCatId={selectedCatId}
              />
            </div>

            {/* Правая обочина */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && <TrackShoulder fieldPx={fieldPx} side="right" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
