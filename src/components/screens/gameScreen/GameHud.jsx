import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import fishIcon from "../../../assets/environment/fish.png";

export default function GameHud({ onMenuClick }) {
  const fishCount = useSelector((s) => s.game.fishCount);

  // всплывающий текст (штраф от Bruno)
  const hudFloatText = useSelector((s) => s.game.hudFloatText);
  const hudFloatSeq = useSelector((s) => s.game.hudFloatSeq);

  // локально “перезапускаем” анимацию через key
  const [floatKey, setFloatKey] = useState(0);
  const [showFloat, setShowFloat] = useState(false);
  const [floatText, setFloatText] = useState("");

  useEffect(() => {
    if (!hudFloatSeq || !hudFloatText) return;

    setFloatText(hudFloatText);
    setFloatKey(hudFloatSeq);
    setShowFloat(true);

    const t = setTimeout(() => setShowFloat(false), 900); // длительность должна совпадать с CSS
    return () => clearTimeout(t);
  }, [hudFloatSeq, hudFloatText]);

  return (
    <div className="absolute top-[-54px] left-0 right-0 flex items-center justify-between">
      {/* Левая табличка: иконка + счёт */}
      <div className="relative">
        {/* Floating "-N" */}
        {showFloat && (
          <div key={floatKey} className="hud-float-negative" aria-hidden="true">
            {floatText}
          </div>
        )}

        <div className="ui-hud flex items-center gap-2">
          <img src={fishIcon} alt="fish" className="w-5 h-5 pixelated" />

          <span className="text-[13px] leading-none font-semibold">
            {fishCount}
          </span>
        </div>
      </div>

      {/* Правая табличка-кнопка: MENU */}
      <button type="button" className="ui-hud-btn" onClick={onMenuClick}>
        menu
      </button>
    </div>
  );
}
