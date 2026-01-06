import { useSelector } from "react-redux";
import fishIcon from "../../../assets/environment/fish.png";

export default function GameHud({ onMenuClick }) {
  const fishCount = useSelector((s) => s.game.fishCount);

  return (
    <div className="absolute top-[-54px] left-0 right-0 flex items-center justify-between">
      {/* Левая табличка: иконка + счёт */}
      <div className="ui-hud flex items-center gap-2">
        <img
          src={fishIcon}
          alt="fish"
          className="w-5 h-5 pixelated"
        />

        {/* Чуть крупнее и “плотнее”, чтобы читалось */}
        <span className="text-[13px] leading-none font-semibold">
          {fishCount}
        </span>
      </div>

      {/* Правая табличка-кнопка: MENU */}
      <button type="button" className="ui-hud-btn" onClick={onMenuClick}>
        menu
      </button>
    </div>
  );
}
