/* ============================================================
   MoyUNNES - storage.js
   Mengelola persistensi data jadwal & tugas di localStorage,
   serta utilitas import/export JSON.
   ============================================================ */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'moyunnes:data:v1';
  const SETTINGS_KEY = 'moyunnes:settings:v1';

  /** Membuat ID unik kompak */
  function uid(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  }

  /** Default seed: hari Senin-Jumat dengan beberapa contoh agar tidak kosong di first-run */
  function defaultData() {
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const palette = ['#0f7a3a', '#2aa55a', '#1f8fbf', '#b07a1a', '#a23a8a'];
    const days = dayNames.map((n, i) => ({
      id: uid('day'),
      name: n,
      color: palette[i % palette.length],
      order: i,
    }));

    const courses = [
      {
        id: uid('crs'),
        dayId: days[0].id,
        name: 'Pemrograman Web',
        lecturer: 'Bpk. Surya',
        room: 'E5-101',
        start: '08:00',
        end: '10:30',
        color: '#0f7a3a',
        note: 'Bawa laptop & charger.',
        order: 0,
      },
      {
        id: uid('crs'),
        dayId: days[2].id,
        name: 'Basis Data',
        lecturer: 'Ibu Dewi',
        room: 'D3-204',
        start: '13:00',
        end: '15:00',
        color: '#1f8fbf',
        note: '',
        order: 0,
      },
    ];

    const tasks = [
      {
        id: uid('tsk'),
        courseId: courses[0].id,
        title: 'Kerjakan tugas HTML form',
        detail: 'Buat form pendaftaran dengan validasi.',
        due: '',
        priority: 'normal',
        done: false,
        order: 0,
        createdAt: Date.now(),
      },
      {
        id: uid('tsk'),
        courseId: courses[1].id,
        title: 'Latihan SQL JOIN',
        detail: 'Selesaikan soal 1-5.',
        due: '',
        priority: 'high',
        done: false,
        order: 0,
        createdAt: Date.now(),
      },
    ];

    return { days, courses, tasks, version: 1 };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = defaultData();
        saveData(seed);
        return seed;
      }
      const parsed = JSON.parse(raw);
      // Sanitize struktur agar selalu lengkap
      parsed.days = Array.isArray(parsed.days) ? parsed.days : [];
      parsed.courses = Array.isArray(parsed.courses) ? parsed.courses : [];
      parsed.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      return parsed;
    } catch (e) {
      console.warn('[MoyUNNES] gagal memuat data, reset:', e);
      const seed = defaultData();
      saveData(seed);
      return seed;
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[MoyUNNES] gagal menyimpan data:', e);
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { theme: 'light', notifyEnabled: false, notifiedTaskIds: [], notifiedCourseKeys: [] };
      return JSON.parse(raw);
    } catch {
      return { theme: 'light', notifyEnabled: false, notifiedTaskIds: [], notifiedCourseKeys: [] };
    }
  }

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
    catch (e) { console.error(e); }
  }

  function exportToFile(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moyunnes-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(String(reader.result || ''));
          if (!obj || typeof obj !== 'object') throw new Error('Format tidak valid');
          obj.days = Array.isArray(obj.days) ? obj.days : [];
          obj.courses = Array.isArray(obj.courses) ? obj.courses : [];
          obj.tasks = Array.isArray(obj.tasks) ? obj.tasks : [];
          resolve(obj);
        } catch (e) { reject(e); }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  global.MoyStorage = {
    uid,
    defaultData,
    loadData,
    saveData,
    loadSettings,
    saveSettings,
    exportToFile,
    importFromFile,
  };
})(window);
