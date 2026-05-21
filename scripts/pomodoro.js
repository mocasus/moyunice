/* ============================================================
   MoyUNNES - pomodoro.js
   Timer fokus belajar (Pomodoro): 25 menit fokus + 5 menit istirahat.
   Konfigurasi & state tersimpan di localStorage.
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'moyunnes:pomodoro:v1';

  const DEFAULT_STATE = {
    mode: 'focus',        // 'focus' | 'break'
    running: false,
    remaining: 25 * 60,   // detik tersisa
    focusMin: 25,
    breakMin: 5,
    sessions: 0,          // total sesi fokus selesai
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const obj = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...obj, running: false }; // selalu mulai dari pause
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function format(seconds) {
    const m = Math.max(0, Math.floor(seconds / 60));
    const s = Math.max(0, Math.floor(seconds % 60));
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /** Membuat instance Pomodoro yang terhubung ke DOM tertentu */
  function create({ display, label, sessionCount, btnStart, btnReset, btnSwitch, focusInput, breakInput, onComplete }) {
    let state = load();
    let intervalId = null;
    let lastTick = null;

    function applyDurationsForCurrentMode() {
      const total = (state.mode === 'focus' ? state.focusMin : state.breakMin) * 60;
      if (state.remaining <= 0 || state.remaining > total) {
        state.remaining = total;
      }
    }

    function render() {
      display.textContent = format(state.remaining);
      label.textContent = state.mode === 'focus' ? 'Fokus' : 'Istirahat';
      label.dataset.mode = state.mode;
      sessionCount.textContent = state.sessions;
      btnStart.textContent = state.running ? 'Jeda' : 'Mulai';
      btnStart.dataset.running = state.running ? '1' : '0';
      if (focusInput && document.activeElement !== focusInput) focusInput.value = state.focusMin;
      if (breakInput && document.activeElement !== breakInput) breakInput.value = state.breakMin;
    }

    function tick() {
      const now = Date.now();
      const delta = lastTick ? Math.round((now - lastTick) / 1000) : 1;
      lastTick = now;
      state.remaining -= delta;
      if (state.remaining <= 0) {
        state.remaining = 0;
        complete();
      }
      save(state);
      render();
    }

    function complete() {
      stop();
      if (state.mode === 'focus') {
        state.sessions += 1;
        state.mode = 'break';
        state.remaining = state.breakMin * 60;
      } else {
        state.mode = 'focus';
        state.remaining = state.focusMin * 60;
      }
      save(state);
      render();
      try {
        // Notif sederhana saat selesai
        if (typeof onComplete === 'function') onComplete(state);
      } catch {}
    }

    function start() {
      if (state.running) return;
      applyDurationsForCurrentMode();
      state.running = true;
      lastTick = Date.now();
      intervalId = setInterval(tick, 1000);
      save(state); render();
    }
    function stop() {
      state.running = false;
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      lastTick = null;
      save(state); render();
    }
    function toggle() { state.running ? stop() : start(); }
    function reset() {
      stop();
      state.remaining = (state.mode === 'focus' ? state.focusMin : state.breakMin) * 60;
      save(state); render();
    }
    function switchMode() {
      stop();
      state.mode = state.mode === 'focus' ? 'break' : 'focus';
      state.remaining = (state.mode === 'focus' ? state.focusMin : state.breakMin) * 60;
      save(state); render();
    }
    function setDurations(focusMin, breakMin) {
      const f = Math.max(1, Math.min(120, Number(focusMin) || state.focusMin));
      const b = Math.max(1, Math.min(60, Number(breakMin) || state.breakMin));
      state.focusMin = f; state.breakMin = b;
      // Jika sedang tidak running, sesuaikan remaining ke nilai baru
      if (!state.running) {
        state.remaining = (state.mode === 'focus' ? f : b) * 60;
      }
      save(state); render();
    }

    btnStart.addEventListener('click', toggle);
    btnReset.addEventListener('click', reset);
    btnSwitch.addEventListener('click', switchMode);
    if (focusInput) focusInput.addEventListener('change', () => setDurations(focusInput.value, breakInput && breakInput.value));
    if (breakInput) breakInput.addEventListener('change', () => setDurations(focusInput && focusInput.value, breakInput.value));

    render();
    return { start, stop, toggle, reset, switchMode, setDurations, getState: () => ({ ...state }) };
  }

  global.MoyPomodoro = { create };
})(window);
