import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";

import { TrackRoad } from "../game/TrackRoad";
import { TrackShoulder } from "../game/TrackShoulders";

import ObstacleLayer from "../game/obstacles/ObstacleLayer";
import FishLayer from "../game/pickups/FishLayer";

import { pauseGame } from "../../features/game/gameSlice";
import { SHOULDER_STRIP_PERCENT } from "../../config/trackRoad";

import { useSquareFieldSize } from "./gameScreen/useSquareFieldSize";
import { useGameControls } from "./gameScreen/useGameControls";
import { useWorldScrollSpeed } from "./gameScreen/useWorldScrollSpeed";

import GameHud from "./gameScreen/GameHud";
import LaneGrid from "./gameScreen/LaneGrid";
import PlayerActor from "./gameScreen/PlayerActor";

export function GameScreen() {
  const dispatch = useDispatch();

  const laneIndex = useSelector((s) => s.game.laneIndex);
  const actionState = useSelector((s) => s.game.actionState);
  const selectedCatId = useSelector((s) => s.game.selectedCatId);

  const status = useSelector((s) => s.game.status);
  const runId = useSelector((s) => s.game.runId);

  // Единая скорость мира (px/sec)
  const scrollSpeedRef = useWorldScrollSpeed(status, runId);

  // Единый сдвиг мира (px). Все "приклеенные" слои читают его.
  const worldOffsetRef = useRef(0);

  useEffect(() => {
    worldOffsetRef.current = 0;
  }, [runId]);

  useEffect(() => {
    if (status !== "running") return;

    let raf = 0;
    let last = performance.now();

    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;

      const speed = scrollSpeedRef?.current ?? 0;
      worldOffsetRef.current += speed * dt;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, scrollSpeedRef]);

  const { fieldRef, fieldPx } = useSquareFieldSize();
  useGameControls(fieldRef);

  // Снимки слоёв: рыбы и препятствия используют это, чтобы избегать друг друга при спавне.
  const obstaclesGetterRef = useRef(() => []);
  const fishGetterRef = useRef(() => []);

  const roadW = Math.floor(fieldPx * (1 - (SHOULDER_STRIP_PERCENT * 2) / 100));

  return (
    <div className="min-h-[100svh] bg-bg grid place-items-center p-3 sm:p-6">
      <div
        className="relative w-full"
        style={{ width: "min(640px, 96vw, calc(100svh - 160px))" }}
      >
        <GameHud onMenuClick={() => dispatch(pauseGame())} />

        <div
          ref={fieldRef}
          className="relative w-full aspect-square rounded-none bg-bg border border-border shadow-soft overflow-hidden"
          style={{ touchAction: "none" }}
        >
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
              {fieldPx > 0 && (
                <TrackShoulder
                  fieldPx={fieldPx}
                  side="left"
                  status={status}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                />
              )}
            </div>

            {/* Центр: дорога + слои */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && (
                <TrackRoad
                  fieldPx={roadW}
                  status={status}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                />
              )}

              {fieldPx > 0 && (
                <ObstacleLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  runId={runId}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                  getFish={() => fishGetterRef.current()}
                  setObstacleSnapshotGetter={(getter) => {
                    obstaclesGetterRef.current = getter;
                  }}
                />
              )}

              {fieldPx > 0 && (
                <FishLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                  getObstacles={() => obstaclesGetterRef.current()}
                  setFishSnapshotGetter={(getter) => {
                    fishGetterRef.current = getter;
                  }}
                />
              )}

              <LaneGrid />

              <PlayerActor
                laneIndex={laneIndex}
                actionState={actionState}
                selectedCatId={selectedCatId}
              />
            </div>

            {/* Правая обочина */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && (
                <TrackShoulder
                  fieldPx={fieldPx}
                  side="right"
                  status={status}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
