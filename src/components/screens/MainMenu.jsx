import { useMemo, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { startGame, selectCat, buyCat, addWalletFish } from "../../features/game/gameSlice";
import { toggleSound } from "../../features/settings/settingsSlice";
import { CATS } from "../../features/game/cats";

import backgroundImg from "../../assets/background.png";

// previews
import miloPreview from "../../assets/sprites/preview/milo.png";
import brunoPreview from "../../assets/sprites/preview/bruno.png";
import lunaPreview from "../../assets/sprites/preview/luna.png";

// sound
import soundOnIcon from "../../assets/sound/sound_on.png";
import soundOffIcon from "../../assets/sound/sound_off.png";

import { audioManager } from "../../audio/audioManager";

// fish
import fishIcon from "../../assets/environment/fish.png";

import CatCarouselCard from "./CatCarouselCard";

const CAT_PREVIEW_BY_ID = {
  milo: miloPreview,
  bruno: brunoPreview,
  luna: lunaPreview,
};

function wrapIndex(idx, n) {
  return ((idx % n) + n) % n;
}

export function MainMenu() {
  const dispatch = useDispatch();

  const selectedCatId = useSelector((s) => s.game.selectedCatId);
  const soundEnabled = useSelector((s) => s.settings.soundEnabled);

  const walletFish = useSelector((s) => s.game.walletFish);
  const walletFloatText = useSelector((s) => s.game.walletFloatText ?? "");
  const walletFloatSeq = useSelector((s) => s.game.walletFloatSeq ?? 0);


  const unlockedCats = useSelector((s) => s.game.unlockedCats);

  const lastRunFish = useSelector((s) => s.game.lastRunFish);



  const initialIndex = useMemo(() => {
    const i = CATS.findIndex((c) => c.id === selectedCatId);
    return i >= 0 ? i : 0;
  }, [selectedCatId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [popFish, setPopFish] = useState(false);


  useEffect(() => {
    if (lastRunFish > 0) {
      setPopFish(true);
      const t = setTimeout(() => setPopFish(false), 520);
      return () => clearTimeout(t);
    }
  }, [lastRunFish]);


  const currentCat = CATS[wrapIndex(currentIndex, CATS.length)];
  const previewSrc = CAT_PREVIEW_BY_ID[currentCat.id];

  const isUnlocked = unlockedCats.includes(currentCat.id);

  const price = currentCat.costFish ?? 0;
  const canBuy = !isUnlocked && walletFish >= price;

  const goPrev = () => setCurrentIndex((i) => wrapIndex(i - 1, CATS.length));
  const goNext = () => setCurrentIndex((i) => wrapIndex(i + 1, CATS.length));

  const onStart = () => {
    if (!isUnlocked) return;
    dispatch(selectCat(currentCat.id));
    dispatch(startGame());
  };

  // ===================== ЧИТКОД(Ctrl + Shift + F "+"/Ctrl + Shift + D "-") ==========================


  useEffect(() => {
    const onKey = (e) => {
      if (!import.meta.env.DEV) return;

      // +1000 рыб
      if (e.ctrlKey && e.shiftKey && e.code === "KeyF") {
        dispatch(addWalletFish(1000));
      }

      // -1000 рыб
      if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
        dispatch(addWalletFish(-1000));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);




  // ============================================================

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-bg">
      <div
        className="ui-panel w-[min(760px,92vw)] relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* clouds */}
        <div
          className="ui-menu-clouds pointer-events-none"
          style={{ backgroundImage: `url(${backgroundImg})` }}
        />
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />

        <div className="relative min-h-[520px]">
          {/* Sound pinned (stable offsets) */}
          <div className="absolute top-6 left-6 ui-fade-in ui-delay-1">
            <button
              className="ui-icon-btn"
              onPointerEnter={() => audioManager.playSfx("uiHover")}
              onClick={() => {
                if (soundEnabled) audioManager.playSfx("uiClick");
                dispatch(toggleSound());
              }}
              aria-label={soundEnabled ? "Sound on" : "Sound off"}
            >
              <img
                src={soundEnabled ? soundOnIcon : soundOffIcon}
                alt=""
                className="pixelated w-8 h-8"
                draggable="false"
              />
            </button>
          </div>

          {/* Fish bank pinned (stable offsets) */}
          <div className="absolute top-6 right-6 ui-fade-in ui-delay-1">
            <div className={`ui-icon-chip relative ${popFish ? "wallet-pop" : ""}`}>
              <img
                src={fishIcon}
                alt="Fish"
                className="pixelated w-8 h-8"
                draggable="false"
              />
              <span className="ui-icon-chip__count">{walletFish}</span>

              {/* ✅ FX: улетающий текст из банка при покупке */}
              {walletFloatSeq > 0 && walletFloatText && (
                <span
                  key={walletFloatSeq}
                  className="ui-wallet-float"
                  aria-hidden="true"
                >
                  {walletFloatText}
                </span>
              )}
            </div>
          </div>


          {/* Top center (fixed, does NOT depend on card height) */}
          <div className="absolute inset-x-0 top-6 flex flex-col items-center pointer-events-none">
            <h1 className="ui-title ui-fade-in ui-delay-1 text-center pointer-events-none">
              KITTY RACE
            </h1>

            {/* fixed spacing between title and start */}
            <div className="h-10" />

            <div className="ui-fade-in ui-delay-2 pointer-events-auto">
              <button
                className="ui-btn-primary px-10 py-3 text-lg"
                onPointerEnter={() => audioManager.playSfx("uiHover")}
                onClick={() => {
                  if (isUnlocked) audioManager.playSfx("uiClick");
                  onStart();
                }}
                title={!isUnlocked ? "Cat is locked" : "Start"}
              >
                START
              </button>
            </div>
          </div>

          {/* Card area (free to grow; start will never move) */}
          <div className="absolute inset-x-0 top-[210px]">
            <div className="w-full px-6 ui-fade-in ui-delay-3 translate-y-[10px]">
              <CatCarouselCard
                cat={currentCat}
                previewSrc={previewSrc}
                isUnlocked={isUnlocked}
                price={price}
                canBuy={canBuy}
                fishIcon={fishIcon}
                onPrev={goPrev}
                onNext={goNext}
                onBuy={() => {
                  dispatch(
                    buyCat({
                      catId: currentCat.id,
                      cost: price,
                    })
                  );
                }}
              />

              {/* keep exactly as you asked */}
              <div className="mt-4 text-center text-xs opacity-70">
                Use arrows to choose a cat. Press START to play as the selected cat.
              </div>
            </div>
          </div>



        </div>
      </div>
    </div>
  );
}

export default MainMenu;
