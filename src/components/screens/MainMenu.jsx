import { useDispatch } from "react-redux";
import { startGame } from "../../features/game/gameSlice.js";

export function MainMenu() {
  const dispatch = useDispatch();

  return (
    <div style={{ padding: 40 }}>
      <h1>Kitty Race — Menu</h1>

      <button onClick={() => dispatch(startGame())}>
        Start
      </button>
    </div>
  );
}