import { useDispatch, useSelector } from "react-redux";
import { startGame, goToGameMenu } from "../../features/game/gameSlice";

import backgroundImg from "../../assets/background.png";
import fishIcon from "../../assets/environment/fish.png";

import { audioManager } from "../../audio/audioManager";


export function GameOverMenu() {
  const dispatch = useDispatch();


  const lastRunFish = useSelector((s) => s.game.lastRunFish ?? 0);


  return (
    <div className="min-h-screen grid place-items-center p-6 bg-bg">
      {/* ui-board — “табличка” */}
      <div
        className="ui-board w-[min(520px,92vw)] p-6 relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* Облака — внутри таблички, только верх */}
        <div
          className="ui-menu-clouds pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImg})`,
            imageRendering: "pixelated",
          }}
          aria-hidden="true"
        />

        {/* лёгкая “вуаль”, чтобы текст читался */}
        <div className="absolute inset-0 bg-white/35 pointer-events-none" />

        <div className="relative">
          <h1 className="ui-board-title">game over</h1>

          {/* Рыбы, собранные за попытку */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <img src={fishIcon} alt="fish" className="w-8 h-8 pixelated" />
            <div className="ui-chip">{lastRunFish}</div>
          </div>

          <div className="mt-10 grid gap-4 place-items-center">
            <button
              className="ui-btn-primary px-10 py-3 text-lg"
              onPointerEnter={() => audioManager.playSfx("uiHover")}
              onClick={() => {
                audioManager.playSfx("uiClick");
                dispatch(startGame());
              }}
            >
              restart
            </button>

            <button
              className="ui-btn-ghost px-10 py-3 text-lg"
              onPointerEnter={() => audioManager.playSfx("uiHover")}
              onClick={() => {
                audioManager.playSfx("uiClick");
                dispatch(goToGameMenu());
              }}
            >
              main menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
