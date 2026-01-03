import { useDispatch } from "react-redux";
import { pauseGame } from "../../features/game/gameSlice";


export function GameScreen() {
  const dispatch = useDispatch();

  return (
    <div style={{ padding: 40 }}>
      <h1>Game Screen</h1>

      <button onClick={() => dispatch(pauseGame())}>
        Menu (Pause)
      </button>
    </div>
  );
}
