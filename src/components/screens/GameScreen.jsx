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
// Важно про паузу:
// - На pause/resume мы НЕ должны перемонтировать ObstacleLayer/FishLayer,
//   иначе их внутреннее состояние (refs) сбросится и игра "начнётся заново".
// - Поэтому тут НЕТ key={runId} на слоях.
// - Полный рестарт делается через runId внутри слоёв (ObstacleLayer смотрит runId и чистит refs сам).

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

  // Глобальное состояние (Redux)
  const laneIndex = useSelector((state) => state.game.laneIndex);
  const actionState = useSelector((state) => state.game.actionState);
  const selectedCatId = useSelector((state) => state.game.selectedCatId);

  // runId увеличивается только на новый забег (start/restart),
  // а на pause/resume НЕ должен меняться.
  // Он нужен, чтобы слои (ObstacleLayer/FishLayer) понимали,
  // что началась новая попытка и можно очистить внутренние refs.
  const runId = useSelector((s) => s.game.runId);

  // ✅ FishLayer должен знать про текущие препятствия (чтобы не класть рыбу на avoidLane)
  // Мы не тащим это в Redux, а просто храним "геттер" в ref.
  const obstaclesGetterRef = useRef(() => []);

  // Управление (стрелки/wasd + jump/slide + pause)
  useGameControls();

  // Размер игрового поля
  const { fieldRef, fieldPx } = useSquareFieldSize();

  // Размер центральной колонки дороги (76% ширины поля)
  const roadW = Math.floor(fieldPx * (1 - (SHOULDER_STRIP_PERCENT * 2) / 100));

  return (
    <div className="min-h-screen bg-bg grid place-items-center">
      {/* Обёртка, чтобы приклеить HUD к полю, но держать его снаружи */}
      <div className="relative w-[min(640px,96vw)]">
        <GameHud onMenuClick={() => dispatch(pauseGame())} />

        {/* Игровое поле */}
        <div
          className="relative w-full aspect-square rounded-none bg-bg border border-border shadow-soft overflow-hidden"
          ref={fieldRef}
        >
          {/* Делим поле на 3 колонки: обочина | дорога (5 lanes) | обочина */}
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

            {/* Центр: дорога + полосы + препятствия + рыбы + кот */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && <TrackRoad fieldPx={roadW} />}

              {/* Препятствия — едут той же скоростью, что и дорога (config/trackRoad.js) */}
              {fieldPx > 0 && (
                <ObstacleLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  runId={runId} // ✅ важно: слою нужен runId для "честного" рестарта
                  setObstacleSnapshotGetter={(getter) => {
                    // getter — это функция, которая возвращает текущий массив препятствий
                    obstaclesGetterRef.current = getter;
                  }}
                />
              )}

              {/* Рыбки — награда (не должны лежать на "опасных" препятствиях avoidLane) */}
              {fieldPx > 0 && (
                <FishLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  getObstacles={() => obstaclesGetterRef.current()}
                />
              )}

              {/* Визуальная сетка полос */}
              <LaneGrid />

              {/* Котик */}
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
