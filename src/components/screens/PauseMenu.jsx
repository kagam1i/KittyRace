import { useDispatch } from "react-redux";
import {
  resumeGame,
  goToGameMenu,
} from "../../features/game/gameSlice";


export function PauseMenu() {
  const dispatch = useDispatch();

  return (
    <div style={{ padding: 40 }}>
      <h1>Pause Menu</h1>

      <button onClick={() => dispatch(resumeGame())}>
        Resume
      </button>

      <button onClick={() => dispatch(goToGameMenu())}>
        Main menu
      </button>
    </div>
  );
}
