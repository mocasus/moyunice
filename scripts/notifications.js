/* ============================================================
   MoyUNNES - notifications.js
   Toast in-app + notifikasi browser untuk:
   - Tugas mendekati / lewat tenggat
   - Mata kuliah dimulai dalam 15 menit
   ============================================================ */
(function (global) {
  'use strict';

  const containerId = 'toastContainer';
  const ICONS = {
    info: '<svg viewBox="0 0 24 24" class="toast-icon"><path fill="currentColor" d="M11 7h2v2h-2V7Zm0 4h2v6h-2v-6Zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/></svg>',
    success: '<svg viewBox="0 0 24 24" class="toast-icon"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19l12-12-1.4-1.4Z"/></svg>',
    warn: '<svg viewBox="0 0 24 24" class="toast-icon"><path fill="currentColor" d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z"/></svg>',
    error: '<svg viewBox="0 0 24 24" class="toast-icon"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 13.6L15.6 17 12 13.4 8.4 17 7 15.6 10.6 12 7 8.4 8.4 7 12 10.6 15.6 7 17 8.4 13.4 12Z"/></svg>',
  };

  function getContainer() {
    return document.getElementById(containerId);
  }

  function toast({ title, message = '', type = 'info', duration = 4200 }) {
    const cont = getContainer();
    if (!cont) return;
    const t = document.createElement('div');
    t.className = 'toast' + (type !== 'info' ? ' ' + type : '');
    t.innerHTML = `
      ${ICONS[type] || ICONS.info}
      <div class="toast-text">
        <strong>${escapeHtml(title)}</strong>
        ${message ? `<small>${escapeHtml(message)}</small>` : ''}
      </div>
    `;
    cont.appendChild(t);
    setTimeout(() => {
      t.classList.add('exit');
      t.addEventListener('animationend', () => t.remove(), { once: true });
    }, duration);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      toast({ title: 'Notifikasi tidak didukung', message: 'Browser kamu tidak mendukung notifikasi.', type: 'warn' });
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      toast({ title: 'Notifikasi diblokir', message: 'Aktifkan dari pengaturan browser.', type: 'warn' });
      return false;
    }
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  function pushNative(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: 'assets/favicon.svg', badge: 'assets/favicon.svg' });
    } catch (e) {
      console.warn('Notification error', e);
    }
  }

  /**
   * Mengecek tugas & mata kuliah, memunculkan pengingat.
   * @param {{days,courses,tasks}} data
   * @param {{notifyEnabled:boolean, notifiedTaskIds:string[], notifiedCourseKeys:string[]}} settings
   * @returns {object} settings yang sudah diperbarui
   */
  function checkReminders(data, settings) {
    const now = new Date();
    const todayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const updated = {
      notifiedTaskIds: [...(settings.notifiedTaskIds || [])],
      notifiedCourseKeys: [...(settings.notifiedCourseKeys || [])],
    };

    // ---- Tugas dengan tenggat ----
    for (const t of data.tasks || []) {
      if (t.done || !t.due) continue;
      const due = new Date(t.due);
      if (Number.isNaN(due.getTime())) continue;
      const diffMin = (due.getTime() - now.getTime()) / 60000;
      const course = (data.courses || []).find(c => c.id === t.courseId);
      const courseName = course ? course.name : 'Tugas';

      // 1 jam sebelum tenggat
      const key1h = t.id + ':1h';
      if (diffMin <= 60 && diffMin > 10 && !updated.notifiedTaskIds.includes(key1h)) {
        toast({ title: '⏰ 1 jam lagi: ' + t.title, message: courseName, type: 'warn', duration: 6000 });
        if (settings.notifyEnabled) pushNative('Tenggat 1 jam lagi', t.title + ' - ' + courseName);
        updated.notifiedTaskIds.push(key1h);
      }
      // 10 menit sebelum tenggat
      const key10 = t.id + ':10m';
      if (diffMin <= 10 && diffMin > 0 && !updated.notifiedTaskIds.includes(key10)) {
        toast({ title: '🔥 10 menit lagi!', message: t.title + ' — ' + courseName, type: 'warn', duration: 7000 });
        if (settings.notifyEnabled) pushNative('Tenggat 10 menit lagi', t.title + ' - ' + courseName);
        updated.notifiedTaskIds.push(key10);
      }
      // Telah lewat tenggat
      const keyOver = t.id + ':overdue';
      if (diffMin < 0 && !updated.notifiedTaskIds.includes(keyOver)) {
        toast({ title: 'Tenggat terlewat', message: t.title + ' — ' + courseName, type: 'error', duration: 7000 });
        if (settings.notifyEnabled) pushNative('Tenggat terlewat', t.title + ' - ' + courseName);
        updated.notifiedTaskIds.push(keyOver);
      }
    }

    // ---- Mata kuliah hari ini, 15 menit sebelum mulai ----
    const today = (data.days || []).find(d => d.name && d.name.toLowerCase() === todayName.toLowerCase());
    if (today) {
      const todays = (data.courses || []).filter(c => c.dayId === today.id && c.start);
      for (const c of todays) {
        const [h, m] = (c.start || '').split(':').map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) continue;
        const startAt = new Date(now);
        startAt.setHours(h, m, 0, 0);
        const diffMin = (startAt.getTime() - now.getTime()) / 60000;
        const dateKey = now.toISOString().slice(0, 10);
        const key = c.id + ':' + dateKey + ':15m';
        if (diffMin <= 15 && diffMin > 0 && !updated.notifiedCourseKeys.includes(key)) {
          toast({ title: '📚 15 menit lagi: ' + c.name, message: (c.room || '') + ' • ' + (c.lecturer || ''), type: 'info', duration: 6000 });
          if (settings.notifyEnabled) pushNative('Kelas akan dimulai', c.name + (c.room ? ' di ' + c.room : ''));
          updated.notifiedCourseKeys.push(key);
        }
      }
    }

    // Pangkas list agar tidak membengkak (simpan max 200)
    if (updated.notifiedTaskIds.length > 200) updated.notifiedTaskIds = updated.notifiedTaskIds.slice(-200);
    if (updated.notifiedCourseKeys.length > 200) updated.notifiedCourseKeys = updated.notifiedCourseKeys.slice(-200);

    return { ...settings, ...updated };
  }

  global.MoyNotify = { toast, requestPermission, pushNative, checkReminders };
})(window);
