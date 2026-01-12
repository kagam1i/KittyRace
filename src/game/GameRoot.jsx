// GameRoot.jsx — корневой компонент игры
// ✅ Важно для паузы:
// GameScreen НЕ должен размонтироваться на paused/gameover,
// иначе refs в слоях (ObstacleLayer/FishLayer) обнулятся и игра начнётся заново.

import { useSelector } from "react-redux";

import { MainMenu } from "../components/screens/MainMenu";
import { GameScreen } from "../components/screens/GameScreen";
import { PauseMenu } from "../components/screens/PauseMenu";
import { GameOverMenu } from "../components/screens/GameOverMenu";

export const GameRoot = () => {
  const gameStatus = useSelector((state) => state.game.status);

  // Меню — отдельный экран (как было)
  if (gameStatus === "menu") return <MainMenu />;

  if (gameStatus === "gameover") return <GameOverMenu />;


  // ✅ Во всех остальных состояниях держим GameScreen смонтированным
  return (
    <div className="relative">
      <GameScreen />

      {gameStatus === "paused" && <PauseMenu />}
    </div>
  );
};
