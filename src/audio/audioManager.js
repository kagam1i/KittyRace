// audioManager.js
// Centralized SFX/music controller.
//
// Rules:
// - No Audio created inside React render.
// - One-time initialization.
// - Small pools for SFX (quick repeats without creating new Audio elements).
//
// Notes:
// - Menu music is looped.
// - Autoplay restrictions mean music can start only after a user gesture.
//   SoundGate handles the first-gesture unlock.

import uiHoverUrl from "../assets/sound/sfx/ui_hover.wav";
import uiClickUrl from "../assets/sound/sfx/ui_click.wav";
import jumpUrl from "../assets/sound/sfx/jump.wav";
import slideUrl from "../assets/sound/sfx/slide.mp3";
import sidestepUrl from "../assets/sound/sfx/sidestep.mp3";
import hitUrl from "../assets/sound/sfx/hit.wav";
import fishPickupUrl from "../assets/sound/sfx/fish_pickup.wav";

import menuMusicUrl from "../assets/sound/music/menu.mp3";

const SFX_POOL_SIZE = 4;

function makePool(src, { volume = 0.6 } = {}) {
  const pool = Array.from({ length: SFX_POOL_SIZE }, () => {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = volume;
    return a;
  });

  let idx = 0;

  return {
    play(enabled) {
      if (!enabled) return;
      const a = pool[idx];
      idx = (idx + 1) % pool.length;

      try {
        a.currentTime = 0;
      } catch (_) {
        // ignore if not seekable yet
      }

      const p = a.play?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    },
    setMuted(muted) {
      for (const a of pool) a.muted = muted;
    },
  };
}

class AudioManager {
  constructor() {
    this._inited = false;
    this._enabled = true;
    this._unlocked = false;

    this._sfx = null;
    this._menuMusic = null;

    // WebAudio for instant UI feedback (reduces click/hover latency)
    this._uiCtx = null;
    this._uiBuffers = { uiClick: null, uiHover: null };
    this._uiGain = null;
  }

  async _initUiWebAudio() {
    // Only needed for UI sounds; keep everything else on <audio> pools.
    if (this._uiCtx || typeof window === "undefined") return;

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    try {
      this._uiCtx = new Ctx();
      this._uiGain = this._uiCtx.createGain();
      this._uiGain.gain.value = 1;
      this._uiGain.connect(this._uiCtx.destination);
    } catch (_) {
      this._uiCtx = null;
      this._uiGain = null;
      return;
    }

    const decode = async (url) => {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      return await this._uiCtx.decodeAudioData(buf);
    };

    // Pre-decode to avoid the first-click delay.
    try {
      const [clickBuf, hoverBuf] = await Promise.all([
        decode(uiClickUrl),
        decode(uiHoverUrl),
      ]);
      this._uiBuffers.uiClick = clickBuf;
      this._uiBuffers.uiHover = hoverBuf;
    } catch (_) {
      // If decoding fails, we'll silently fall back to the <audio> pools.
    }
  }

  _playUiWebAudio(name) {
    if (!this._uiCtx || !this._uiGain) return false;
    const buffer = this._uiBuffers?.[name];
    if (!buffer) return false;

    try {
      const src = this._uiCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(this._uiGain);
      src.start(0);
      return true;
    } catch (_) {
      return false;
    }
  }

  initOnce() {
    if (this._inited) return;

    this._sfx = {
      uiHover: makePool(uiHoverUrl, { volume: 0.35 }),
      uiClick: makePool(uiClickUrl, { volume: 0.45 }),
      jump: makePool(jumpUrl, { volume: 0.5 }),
      slide: makePool(slideUrl, { volume: 0.5 }),
      sidestep: makePool(sidestepUrl, { volume: 0.45 }),
      hit: makePool(hitUrl, { volume: 0.55 }),
      fishPickup: makePool(fishPickupUrl, { volume: 0.5 }),
    };

    const music = new Audio(menuMusicUrl);
    music.preload = "auto";
    music.loop = true;
    music.volume = 0.25;
    this._menuMusic = music;

    this._applyMuteState();
    this._inited = true;
  }

  setEnabled(enabled) {
    this._enabled = Boolean(enabled);
    this.initOnce();
    this._applyMuteState();

    if (!this._enabled) {
      this.stopMenuMusic();
    }
  }

  unlock() {
    this.initOnce();
    this._unlocked = true;

    // After the first user gesture we can safely create/resume AudioContext
    // and pre-decode UI sounds to remove perceived latency.
    void this._initUiWebAudio().then(async () => {
      try {
        if (this._uiCtx?.state === "suspended") {
          await this._uiCtx.resume();
        }
      } catch (_) {}
    });
  }

  get unlocked() {
    return this._unlocked;
  }

  _applyMuteState() {
    const muted = !this._enabled;

    if (this._sfx) {
      for (const key of Object.keys(this._sfx)) {
        this._sfx[key].setMuted(muted);
      }
    }

    if (this._menuMusic) {
      this._menuMusic.muted = muted;
    }
  }

  playSfx(name) {
    this.initOnce();
    if (!this._enabled) return;

    // UI sounds via WebAudio for immediate response; fallback to pool.
    if (name === "uiClick" || name === "uiHover") {
      const played = this._playUiWebAudio(name);
      if (played) return;
    }

    const sfx = this._sfx?.[name];
    if (!sfx) return;
    sfx.play(true);
  }

  // Menu + gameplay use the same track; we only change volume by context.
  playMenuMusic({ volume = 0.25 } = {}) {
    this.initOnce();
    if (!this._enabled) return;
    if (!this._unlocked) return;

    const a = this._menuMusic;
    if (!a) return;

    if (typeof volume === "number") a.volume = volume;
    a.loop = true;

    if (!a.paused) return;

    const p = a.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  // Same track as menu, but quieter so SFX are clearly heard.
  playGameMusic({ volume = 0.18 } = {}) {
    this.initOnce();
    if (!this._enabled) return;
    if (!this._unlocked) return;

    const a = this._menuMusic;
    if (!a) return;

    if (typeof volume === "number") a.volume = volume;
    a.loop = true;

    if (!a.paused) return;

    const p = a.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  stopGameMusic() {
    this.stopMenuMusic();
  }

  stopMenuMusic() {
    this.initOnce();
    const a = this._menuMusic;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch (_) {}
  }
}

export const audioManager = new AudioManager();
