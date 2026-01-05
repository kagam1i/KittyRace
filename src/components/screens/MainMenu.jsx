import { useDispatch, useSelector } from "react-redux";
import { startGame, selectCat } from "../../features/game/gameSlice";
import { toggleSound } from "../../features/settings/settingsSlice";
import { CATS } from "../../features/game/cats";

import backgroundImg from "../../assets/background.png";

// Превью котиков для карточек
import miloPreview from "../../assets/sprites/preview/milo.png";
import brunoPreview from "../../assets/sprites/preview/bruno.png";
import lunaPreview from "../../assets/sprites/preview/luna.png";

// Иконки звука
import soundOnIcon from "../../assets/sound/sound_on.png";
import soundOffIcon from "../../assets/sound/sound_off.png";

// Карта: id кота -> картинка превью
const CAT_PREVIEW_BY_ID = {
  milo: miloPreview,
  bruno: brunoPreview,
  luna: lunaPreview,
};

export function MainMenu() {
  const dispatch = useDispatch();

  const selectedCatId = useSelector((s) => s.game.selectedCatId);
  const soundEnabled = useSelector((s) => s.settings.soundEnabled);

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-bg">
      <div
        className="ui-panel w-[min(520px,92vw)] p-6 relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* облачный параллакс (очень лёгкий) */}
        <div
          className="ui-menu-clouds pointer-events-none"
          style={{ backgroundImage: `url(${backgroundImg})` }}
        />

        {/* лёгкая “вуаль”, чтобы UI читался */}
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />

        <div className="relative">
          <div
            className="ui-fade-in ui-delay-1 grid items-center"
            style={{ gridTemplateColumns: "48px 1fr 48px" }}
          >
            {/* левая колонка */}
            <button
              className="ui-icon-btn justify-self-start"
              onClick={() => dispatch(toggleSound())}
              aria-label={soundEnabled ? "Sound on" : "Sound off"}
            >
              <img
                src={soundEnabled ? soundOnIcon : soundOffIcon}
                alt=""
                className="pixelated w-8 h-8"
                draggable="false"
              />
            </button>

            {/* центр */}
            <h1 className="ui-title text-center">Kitty race</h1>

            {/* правая колонка — пустая, но той же ширины */}
            <div />
          </div>

          <div
            className="mt-10 grid place-items-center ui-fade-in ui-delay-2"
          >
            <button
              className="ui-btn-primary px-10 py-3 text-lg"
              onClick={() => dispatch(startGame())}
            >
              Start
            </button>
          </div>

          {/* Выбор котика в одну линию */}
          <div
            className="mt-8 flex justify-center gap-4 flex-wrap ui-fade-in ui-delay-3"
          >
            {CATS.map((cat) => {
              const previewSrc = CAT_PREVIEW_BY_ID[cat.id];
              const isActive = cat.id === selectedCatId;

              return (
                <button
                  key={cat.id}
                  className={`ui-cat-card ${isActive ? "is-active" : ""}`}
                  onClick={() => dispatch(selectCat(cat.id))}
                >
                  {/* Бейдж выбора */}
                  {isActive && (
                    <div className="ui-cat-card__badge">Selected</div>
                  )}

                  {/* Картинка превью */}
                  <div
                    className="ui-cat-card__img"
                    style={{ backgroundImage: `url(${previewSrc})` }}
                    aria-label={cat.name}
                  />

                  {/* Подпись снизу */}
                  <div className="ui-cat-card__label">{cat.id}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
