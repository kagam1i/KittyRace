// GameRoot.jsx — корневой компонент игры
// ✅ Важно для паузы:
// GameScreen НЕ должен размонтироваться на paused/gameover,
// иначе refs в слоях (ObstacleLayer/FishLayer) обнулятся и игра начнётся заново.

import { useSelector } from "react-redux";

import { SoundGate } from "../audio/SoundGate";

import { MainMenu } from "../components/screens/MainMenu";
import { GameScreen } from "../components/screens/GameScreen";
import { PauseMenu } from "../components/screens/PauseMenu";
import { GameOverMenu } from "../components/screens/GameOverMenu";

export const GameRoot = () => {
  const gameStatus = useSelector((state) => state.game.status);

  let content;

  if (gameStatus === "menu") content = <MainMenu />;
  else if (gameStatus === "gameover") content = <GameOverMenu />;
  else {
    content = (
      <div className="relative">
        <GameScreen />

        {gameStatus === "paused" && <PauseMenu />}
      </div>
    );
  }

  return <SoundGate>{content}</SoundGate>;
};
