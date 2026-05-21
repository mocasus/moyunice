/* ============================================================
   MoyUNNES - app.js (v3)
   Controller utama: render UI, CRUD hari/mata kuliah/tugas,
   modal management, Pomodoro, shortcut, sort, print, dll.
   ============================================================ */
(function () {
  'use strict';

  // ===== State =====
  let data = MoyStorage.loadData();
  let settings = MoyStorage.loadSettings();
  let activeFilter = 'all';
  let activeDayId = null;        // null = tampil semua hari
  let searchQuery = '';
  let sortMode = settings.sortMode || 'manual';

  // ===== DOM refs =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const dayList = $('#dayList');
  const dayColumns = $('#dayColumns');
  const courseDaySelect = $('#courseDaySelect');

  // ===== Init =====
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    $('#year').textContent = new Date().getFullYear();
    applyTheme(settings.theme || 'light');
    if ($('#sortSelect')) $('#sortSelect').value = sortMode;
    renderAll();
    bindEvents();
    initPomodoro();
    bindShortcuts();

    // Drag-and-drop
    MoyDnd.attach(dayColumns, { onCommit: handleDndCommit });

    // Mulai pengingat
    runReminders();
    setInterval(runReminders, 60 * 1000); // cek tiap menit
  }

  function persist() { MoyStorage.saveData(data); }
  function persistSettings() { MoyStorage.saveSettings(settings); }

  // ===========================================================
  //                   POMODORO
  // ===========================================================
  function initPomodoro() {
    if (!window.MoyPomodoro) return;
    MoyPomodoro.create({
      display: $('#pomoDisplay'),
      label: $('#pomoLabel'),
      sessionCount: $('#pomoSessions'),
      btnStart: $('#pomoStart'),
      btnReset: $('#pomoReset'),
      btnSwitch: $('#pomoSwitch'),
      focusInput: $('#pomoFocus'),
      breakInput: $('#pomoBreak'),
      onComplete: (state) => {
        const isFocus = state.mode === 'break'; // baru saja selesai fokus
        const title = isFocus ? '🎉 Sesi fokus selesai!' : '🔁 Istirahat selesai';
        const msg = isFocus ? 'Saatnya istirahat sebentar.' : 'Yuk lanjut fokus!';
        MoyNotify.toast({ title, message: msg, type: 'success', duration: 6000 });
        if (settings.notifyEnabled) MoyNotify.pushNative(title, msg);
      },
    });
  }

  // ===========================================================
  //                   RENDER
  // ===========================================================
  function renderAll() {
    renderSidebarDays();
    renderDayColumns();
    renderStats();
    populateCourseDaySelect();
  }

  function renderSidebarDays() {
    const sortedDays = [...data.days].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    dayList.innerHTML = '';
    if (sortedDays.length === 0) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="muted">Belum ada hari. Klik "Tambah".</span>';
      li.style.cursor = 'default';
      dayList.appendChild(li);
      return;
    }
    for (const d of sortedDays) {
      const courseCount = data.courses.filter(c => c.dayId === d.id).length;
      const li = document.createElement('li');
      li.dataset.id = d.id;
      if (activeDayId === d.id) li.classList.add('active');
      li.innerHTML = `
        <span class="dot" style="background:${escapeAttr(d.color || '#f5b800')}"></span>
        <span class="day-name">${escapeHtml(d.name)}</span>
        <span class="count">${courseCount}</span>
        <span class="day-actions">
          <button class="icon-btn" data-action="edit-day" title="Ubah hari">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm17.71-10.04a1 1 0 0 0 0-1.42l-2.5-2.5a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 2-1.66Z"/></svg>
          </button>
          <button class="icon-btn" data-action="delete-day" title="Hapus hari">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>
          </button>
        </span>
      `;
      li.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-action]')) return;
        activeDayId = (activeDayId === d.id) ? null : d.id;
        renderAll();
      });
      li.querySelector('[data-action="edit-day"]').addEventListener('click', (e) => {
        e.stopPropagation(); openDayModal(d);
      });
      li.querySelector('[data-action="delete-day"]').addEventListener('click', (e) => {
        e.stopPropagation(); confirmDeleteDay(d);
      });
      dayList.appendChild(li);
    }
  }

  function renderDayColumns() {
    dayColumns.innerHTML = '';
    const todayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();

    let days = [...data.days].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (activeFilter === 'today') {
      days = days.filter(d => (d.name || '').toLowerCase() === todayName);
    } else if (activeFilter === 'active') {
      days = days.filter(d => data.courses.some(c => c.dayId === d.id));
    }
    if (activeDayId) days = days.filter(d => d.id === activeDayId);

    if (days.length === 0) {
      dayColumns.innerHTML = `
        <div class="day-column" style="grid-column: 1/-1; text-align:center; padding:40px;">
          <h3 style="margin-bottom:8px;">Tidak ada hari untuk ditampilkan</h3>
          <p class="muted" style="margin-bottom:14px;">Tambahkan hari atau ubah filter di atas.</p>
        </div>
      `;
      return;
    }

    for (const d of days) {
      const isToday = (d.name || '').toLowerCase() === todayName;
      const col = document.createElement('div');
      col.className = 'day-column' + (isToday ? ' is-today' : '');
      col.dataset.dayId = d.id;
      col.style.setProperty('--day-accent', d.color || '#f5b800');
      col.innerHTML = `
        <div class="day-column-head">
          <div class="day-column-title">
            <h3>${escapeHtml(d.name)}</h3>
            <span class="badge" data-role="course-count">0</span>
            ${isToday ? '<span class="today-pill">Hari ini</span>' : ''}
          </div>
          <div class="day-column-actions">
            <button class="icon-btn" data-action="add-course" title="Tambah mata kuliah">
              <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
            </button>
          </div>
        </div>
        <div class="course-list" data-day-id="${d.id}"></div>
      `;
      const list = col.querySelector('.course-list');
      const courses = data.courses
        .filter(c => c.dayId === d.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const filtered = filterCourses(courses);
      filtered.forEach(c => list.appendChild(renderCourseCard(c)));
      if (filtered.length === 0) list.classList.add('empty');

      col.querySelector('[data-role="course-count"]').textContent = courses.length;
      col.querySelector('[data-action="add-course"]').addEventListener('click', () => {
        openCourseModal(null, d.id);
      });

      dayColumns.appendChild(col);
    }
  }

  function filterCourses(courses) {
    if (!searchQuery) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(c => {
      if ((c.name || '').toLowerCase().includes(q)) return true;
      if ((c.lecturer || '').toLowerCase().includes(q)) return true;
      if ((c.room || '').toLowerCase().includes(q)) return true;
      const tasks = data.tasks.filter(t => t.courseId === c.id);
      return tasks.some(t => (t.title || '').toLowerCase().includes(q) || (t.detail || '').toLowerCase().includes(q));
    });
  }

  function sortTasks(tasks) {
    const arr = [...tasks];
    if (sortMode === 'due') {
      const inf = Number.POSITIVE_INFINITY;
      arr.sort((a, b) => {
        const da = a.due ? new Date(a.due).getTime() : inf;
        const db = b.due ? new Date(b.due).getTime() : inf;
        return da - db || (a.order ?? 0) - (b.order ?? 0);
      });
    } else if (sortMode === 'priority') {
      const rank = { high: 0, normal: 1, low: 2 };
      arr.sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1) || (a.order ?? 0) - (b.order ?? 0));
    } else if (sortMode === 'created') {
      arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    } else {
      arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return arr;
  }

  function renderCourseCard(c) {
    const card = document.createElement('article');
    card.className = 'course-card';
    card.draggable = true;
    card.dataset.id = c.id;
    card.dataset.dayId = c.dayId;
    card.style.setProperty('--course-accent', c.color || '#f5b800');

    const time = (c.start || c.end) ? `${c.start || '--:--'} – ${c.end || '--:--'}` : '';
    const chips = [];
    if (time) chips.push(`<span class="chip time">⏰ ${escapeHtml(time)}</span>`);
    if (c.room) chips.push(`<span class="chip room">📍 ${escapeHtml(c.room)}</span>`);
    if (c.lecturer) chips.push(`<span class="chip">👨‍🏫 ${escapeHtml(c.lecturer)}</span>`);

    const taskCount = data.tasks.filter(t => t.courseId === c.id).length;
    const taskDoneCount = data.tasks.filter(t => t.courseId === c.id && t.done).length;
    if (taskCount > 0) {
      chips.push(`<span class="chip">✅ ${taskDoneCount}/${taskCount}</span>`);
    }

    card.innerHTML = `
      <div class="course-head">
        <div>
          <div class="course-title">${escapeHtml(c.name)}</div>
          <div class="course-meta">${chips.join('')}</div>
        </div>
        <div class="course-actions">
          <button class="icon-btn" data-action="edit" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z"/></svg></button>
          <button class="icon-btn" data-action="delete" title="Hapus"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg></button>
        </div>
      </div>
      ${c.note ? `<div class="course-note">${escapeHtml(c.note)}</div>` : ''}
      <div class="task-section">
        <div class="task-section-head">
          <h4>Tugas</h4>
          <button data-action="add-task">+ Tambah tugas</button>
        </div>
        <div class="task-list" data-course-id="${c.id}"></div>
      </div>
    `;

    const tasks = sortTasks(data.tasks.filter(t => t.courseId === c.id));
    const taskList = card.querySelector('.task-list');
    tasks.forEach(t => taskList.appendChild(renderTaskItem(t)));

    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation(); openCourseModal(c, c.dayId);
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation(); confirmDeleteCourse(c);
    });
    card.querySelector('[data-action="add-task"]').addEventListener('click', (e) => {
      e.stopPropagation(); openTaskModal(null, c.id);
    });

    return card;
  }

  function renderTaskItem(t) {
    const li = document.createElement('div');
    li.className = 'task-item' + (t.done ? ' done' : '');
    li.draggable = true;
    li.dataset.id = t.id;
    li.dataset.courseId = t.courseId;

    const dueInfo = formatDue(t.due);
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const subDone = subtasks.filter(s => s.done).length;
    const subTotal = subtasks.length;
    const subPct = subTotal ? Math.round((subDone / subTotal) * 100) : 0;
    const hasSub = subTotal > 0;

    li.innerHTML = `
      <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Tandai selesai" />
      <div class="task-main">
        <div class="task-row">
          <div class="title">${escapeHtml(t.title)}</div>
          ${hasSub ? `<button class="sub-toggle" data-action="toggle-sub" aria-label="Lihat subtugas" title="Subtugas (${subDone}/${subTotal})">▾</button>` : ''}
        </div>
        <div class="sub">
          <span class="priority-pill priority-${escapeAttr(t.priority || 'normal')}">${labelPriority(t.priority)}</span>
          ${dueInfo.html}
          ${hasSub ? `<span class="due-pill">📋 ${subDone}/${subTotal}</span>` : ''}
          ${t.detail ? `<span class="muted" title="${escapeAttr(t.detail)}">📝</span>` : ''}
        </div>
        ${hasSub ? `
          <div class="subtask-progress" aria-hidden="true">
            <div class="subtask-progress-bar" style="width:${subPct}%"></div>
          </div>
          <ul class="subtask-list" hidden>
            ${subtasks.map((s, i) => `
              <li class="subtask-item ${s.done ? 'done' : ''}">
                <input type="checkbox" data-sub-index="${i}" ${s.done ? 'checked' : ''} aria-label="Selesai subtugas" />
                <span>${escapeHtml(s.title)}</span>
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
      <button class="icon-btn" data-action="edit-task" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z"/></svg></button>
      <button class="icon-btn" data-action="delete-task" title="Hapus"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg></button>
    `;

    li.querySelector('input[type="checkbox"]').addEventListener('change', (ev) => {
      t.done = ev.target.checked;
      // Saat menandai selesai, tandai semua subtask selesai juga
      if (t.done && Array.isArray(t.subtasks)) {
        t.subtasks.forEach(s => s.done = true);
      }
      persist();
      renderAll();
      if (t.done) MoyNotify.toast({ title: '✅ Tugas selesai', message: t.title, type: 'success' });
    });
    li.querySelectorAll('input[data-sub-index]').forEach(cb => {
      cb.addEventListener('change', (ev) => {
        const i = Number(ev.target.dataset.subIndex);
        if (Array.isArray(t.subtasks) && t.subtasks[i]) {
          t.subtasks[i].done = ev.target.checked;
          // Auto: jika semua subtask selesai → tugas dianggap selesai
          if (t.subtasks.every(s => s.done)) t.done = true;
          else if (t.done && t.subtasks.some(s => !s.done)) t.done = false;
          persist();
          renderAll();
        }
      });
    });
    const subToggle = li.querySelector('[data-action="toggle-sub"]');
    if (subToggle) {
      subToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const ul = li.querySelector('.subtask-list');
        if (ul) ul.hidden = !ul.hidden;
        subToggle.textContent = (ul && !ul.hidden) ? '▴' : '▾';
      });
    }
    li.querySelector('[data-action="edit-task"]').addEventListener('click', (e) => {
      e.stopPropagation(); openTaskModal(t, t.courseId);
    });
    li.querySelector('[data-action="delete-task"]').addEventListener('click', (e) => {
      e.stopPropagation(); confirmDeleteTask(t);
    });
    return li;
  }

  function renderStats() {
    const courses = data.courses.length;
    const tasks = data.tasks.length;
    const done = data.tasks.filter(t => t.done).length;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let dueSoon = 0, overdue = 0;
    data.tasks.forEach(t => {
      if (t.done || !t.due) return;
      const d = new Date(t.due).getTime();
      if (Number.isNaN(d)) return;
      if (d < now) overdue += 1;
      else if (d - now <= dayMs) dueSoon += 1;
    });

    $('#statCourses').textContent = courses;
    $('#statTasks').textContent = tasks;
    $('#statDone').textContent = done;
    if ($('#statDueSoon')) $('#statDueSoon').textContent = dueSoon;
    if ($('#statOverdue')) $('#statOverdue').textContent = overdue;
    const pct = tasks ? Math.round((done / tasks) * 100) : 0;
    $('#progressBar').style.width = pct + '%';
    $('#progressText').textContent = pct + '% selesai';

    // Update count di sidebar tanpa rerender penuh
    $$('#dayList li').forEach(li => {
      const id = li.dataset.id;
      if (!id) return;
      const count = data.courses.filter(c => c.dayId === id).length;
      const span = li.querySelector('.count');
      if (span) span.textContent = count;
    });
  }

  function populateCourseDaySelect() {
    courseDaySelect.innerHTML = '';
    const sorted = [...data.days].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (sorted.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '— Tambahkan hari dulu —';
      opt.disabled = true;
      courseDaySelect.appendChild(opt);
      return;
    }
    for (const d of sorted) {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      courseDaySelect.appendChild(opt);
    }
  }

  // ===========================================================
  //                   EVENTS
  // ===========================================================
  function bindEvents() {
    $('#addDayBtn').addEventListener('click', () => openDayModal(null));
    $('#addCourseBtn').addEventListener('click', () => openCourseModal(null, null));
    $('#filterSelect').addEventListener('change', (e) => { activeFilter = e.target.value; renderDayColumns(); });
    if ($('#sortSelect')) {
      $('#sortSelect').addEventListener('change', (e) => {
        sortMode = e.target.value;
        settings.sortMode = sortMode;
        persistSettings();
        renderDayColumns();
      });
    }
    $('#searchInput').addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderDayColumns();
    });
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#exportBtn').addEventListener('click', () => {
      MoyStorage.exportToFile(data);
      MoyNotify.toast({ title: 'Data diexport', message: 'File JSON berhasil diunduh.', type: 'success' });
    });
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const obj = await MoyStorage.importFromFile(f);
        data = obj;
        persist();
        renderAll();
        MoyNotify.toast({ title: 'Import berhasil', message: 'Data telah dimuat.', type: 'success' });
      } catch (err) {
        MoyNotify.toast({ title: 'Gagal import', message: 'File tidak valid.', type: 'error' });
      } finally {
        e.target.value = '';
      }
    });
    $('#notifyBtn').addEventListener('click', async () => {
      const ok = await MoyNotify.requestPermission();
      settings.notifyEnabled = ok;
      persistSettings();
      if (ok) MoyNotify.toast({ title: 'Notifikasi aktif', message: 'Kamu akan menerima pengingat otomatis.', type: 'success' });
    });
    if ($('#printBtn')) {
      $('#printBtn').addEventListener('click', () => {
        const printDate = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
        if ($('#printDate')) $('#printDate').textContent = 'Dicetak: ' + printDate;
        window.print();
      });
    }
    if ($('#helpBtn')) {
      $('#helpBtn').addEventListener('click', () => { $('#helpModal').hidden = false; });
    }

    // Modal close (semua modal)
    document.addEventListener('click', (ev) => {
      const closer = ev.target.closest('[data-close-modal]');
      if (closer) {
        closer.closest('.modal').hidden = true;
      } else if (ev.target.classList.contains('modal')) {
        ev.target.hidden = true;
      }
    });

    // Form submits
    $('#dayForm').addEventListener('submit', onDaySubmit);
    $('#courseForm').addEventListener('submit', onCourseSubmit);
    $('#taskForm').addEventListener('submit', onTaskSubmit);

    // Subtask editor di modal task
    if ($('#subtaskAddBtn')) {
      $('#subtaskAddBtn').addEventListener('click', () => addSubtaskRow(''));
    }
  }

  // ===========================================================
  //                   KEYBOARD SHORTCUTS
  // ===========================================================
  function bindShortcuts() {
    document.addEventListener('keydown', (ev) => {
      // Esc selalu boleh untuk tutup modal
      if (ev.key === 'Escape') {
        $$('.modal').forEach(m => m.hidden = true);
        return;
      }

      // Ctrl+K untuk fokus search (juga saat di input)
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        $('#searchInput').focus();
        $('#searchInput').select();
        return;
      }

      // Skip shortcut lain saat sedang mengetik
      const tag = (ev.target && ev.target.tagName) || '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (ev.target && ev.target.isContentEditable)) return;

      // Tampilkan help dengan ? atau /
      if (ev.key === '?' || (ev.shiftKey && ev.key === '/')) {
        ev.preventDefault();
        $('#helpModal').hidden = false;
        return;
      }

      switch (ev.key.toLowerCase()) {
        case 'n':
          ev.preventDefault();
          openCourseModal(null, null);
          break;
        case 'd':
          if (ev.shiftKey) {
            ev.preventDefault();
            openDayModal(null);
          }
          break;
        case 't':
          ev.preventDefault();
          toggleTheme();
          break;
        case 'p':
          ev.preventDefault();
          if ($('#pomoStart')) $('#pomoStart').click();
          break;
        case 'f':
          ev.preventDefault();
          const sel = $('#filterSelect');
          if (sel) {
            sel.value = sel.value === 'today' ? 'all' : 'today';
            sel.dispatchEvent(new Event('change'));
          }
          break;
      }
    });
  }

  // ===========================================================
  //                   THEME
  // ===========================================================
  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    settings.theme = theme;
    persistSettings();
    // Update theme-color meta agar address bar mobile ikut berubah
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#382a00' : '#f5b800';
  }
  function toggleTheme() {
    applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
  }

  // ===========================================================
  //                   DAY CRUD
  // ===========================================================
  let editingDay = null;
  function openDayModal(day) {
    editingDay = day;
    const f = $('#dayForm');
    f.reset();
    if (day) {
      f.name.value = day.name || '';
      f.color.value = day.color || '#f5b800';
      $('#dayModalTitle').textContent = 'Ubah Hari';
    } else {
      $('#dayModalTitle').textContent = 'Tambah Hari';
    }
    $('#dayModal').hidden = false;
    setTimeout(() => f.name.focus(), 50);
  }
  function onDaySubmit(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const name = String(fd.get('name') || '').trim();
    const color = String(fd.get('color') || '#f5b800');
    if (!name) return;
    if (editingDay) {
      const d = data.days.find(d => d.id === editingDay.id);
      if (d) { d.name = name; d.color = color; }
    } else {
      const order = data.days.length;
      data.days.push({ id: MoyStorage.uid('day'), name, color, order });
    }
    persist();
    $('#dayModal').hidden = true;
    renderAll();
    MoyNotify.toast({ title: editingDay ? 'Hari diperbarui' : 'Hari ditambahkan', message: name, type: 'success' });
    editingDay = null;
  }
  function confirmDeleteDay(day) {
    const courseCount = data.courses.filter(c => c.dayId === day.id).length;
    openConfirm({
      title: 'Hapus hari?',
      text: `Hari "${day.name}" akan dihapus${courseCount ? ` beserta ${courseCount} mata kuliah & semua tugasnya` : ''}.`,
      onOk: () => {
        const courseIds = data.courses.filter(c => c.dayId === day.id).map(c => c.id);
        data.tasks = data.tasks.filter(t => !courseIds.includes(t.courseId));
        data.courses = data.courses.filter(c => c.dayId !== day.id);
        data.days = data.days.filter(d => d.id !== day.id);
        if (activeDayId === day.id) activeDayId = null;
        persist();
        renderAll();
        MoyNotify.toast({ title: 'Hari dihapus', message: day.name, type: 'warn' });
      }
    });
  }

  // ===========================================================
  //                   COURSE CRUD
  // ===========================================================
  let editingCourse = null;
  function openCourseModal(course, dayId) {
    if (data.days.length === 0) {
      MoyNotify.toast({ title: 'Tambahkan hari dulu', message: 'Buat minimal satu hari sebelum menambah mata kuliah.', type: 'warn' });
      return;
    }
    editingCourse = course;
    populateCourseDaySelect();
    const f = $('#courseForm');
    f.reset();
    if (course) {
      f.name.value = course.name || '';
      f.lecturer.value = course.lecturer || '';
      f.start.value = course.start || '';
      f.end.value = course.end || '';
      f.room.value = course.room || '';
      f.color.value = course.color || '#f5b800';
      f.note.value = course.note || '';
      f.dayId.value = course.dayId;
      $('#courseModalTitle').textContent = 'Ubah Mata Kuliah';
    } else {
      f.color.value = '#f5b800';
      f.dayId.value = dayId || data.days[0].id;
      $('#courseModalTitle').textContent = 'Tambah Mata Kuliah';
    }
    $('#courseModal').hidden = false;
    setTimeout(() => f.name.focus(), 50);
  }
  function onCourseSubmit(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const payload = {
      name: String(fd.get('name') || '').trim(),
      lecturer: String(fd.get('lecturer') || '').trim(),
      start: String(fd.get('start') || ''),
      end: String(fd.get('end') || ''),
      room: String(fd.get('room') || '').trim(),
      color: String(fd.get('color') || '#f5b800'),
      note: String(fd.get('note') || '').trim(),
      dayId: String(fd.get('dayId') || ''),
    };
    if (!payload.name || !payload.dayId) return;

    if (editingCourse) {
      const c = data.courses.find(c => c.id === editingCourse.id);
      if (c) Object.assign(c, payload);
    } else {
      const order = data.courses.filter(c => c.dayId === payload.dayId).length;
      data.courses.push({ id: MoyStorage.uid('crs'), order, ...payload });
    }
    persist();
    $('#courseModal').hidden = true;
    renderAll();
    MoyNotify.toast({ title: editingCourse ? 'Mata kuliah diperbarui' : 'Mata kuliah ditambahkan', message: payload.name, type: 'success' });
    editingCourse = null;
  }
  function confirmDeleteCourse(course) {
    const taskCount = data.tasks.filter(t => t.courseId === course.id).length;
    openConfirm({
      title: 'Hapus mata kuliah?',
      text: `"${course.name}" akan dihapus${taskCount ? ` beserta ${taskCount} tugasnya` : ''}.`,
      onOk: () => {
        data.tasks = data.tasks.filter(t => t.courseId !== course.id);
        data.courses = data.courses.filter(c => c.id !== course.id);
        persist(); renderAll();
        MoyNotify.toast({ title: 'Mata kuliah dihapus', message: course.name, type: 'warn' });
      }
    });
  }

  // ===========================================================
  //                   TASK CRUD (+ SUBTASK)
  // ===========================================================
  let editingTask = null;

  function clearSubtaskEditor() {
    const editor = $('#subtaskEditor');
    if (editor) editor.innerHTML = '';
  }
  function addSubtaskRow(value) {
    const editor = $('#subtaskEditor');
    if (!editor) return;
    const row = document.createElement('div');
    row.className = 'subtask-row';
    row.innerHTML = `
      <input type="text" class="sub-input" placeholder="Contoh: baca bab 1" value="${escapeAttr(value || '')}" />
      <button type="button" class="icon-btn" data-action="remove-sub" aria-label="Hapus subtugas">×</button>
    `;
    row.querySelector('[data-action="remove-sub"]').addEventListener('click', () => row.remove());
    editor.appendChild(row);
    const input = row.querySelector('input');
    setTimeout(() => input.focus(), 30);
  }
  function readSubtasksFromEditor(existing) {
    const rows = $$('#subtaskEditor .subtask-row');
    return rows.map((row, i) => {
      const title = (row.querySelector('input').value || '').trim();
      const prev = existing && existing[i];
      return { title, done: prev ? !!prev.done : false };
    }).filter(s => s.title.length > 0);
  }

  function openTaskModal(task, courseId) {
    editingTask = task ? { ...task } : null;
    const f = $('#taskForm');
    f.reset();
    f.dataset.courseId = courseId || (task && task.courseId) || '';
    clearSubtaskEditor();
    if (task) {
      f.title.value = task.title || '';
      f.due.value = task.due || '';
      f.priority.value = task.priority || 'normal';
      f.detail.value = task.detail || '';
      (task.subtasks || []).forEach(s => addSubtaskRow(s.title));
      $('#taskModalTitle').textContent = 'Ubah Tugas';
    } else {
      $('#taskModalTitle').textContent = 'Tambah Tugas';
    }
    $('#taskModal').hidden = false;
    setTimeout(() => f.title.focus(), 50);
  }
  function onTaskSubmit(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const courseId = ev.target.dataset.courseId || (editingTask && editingTask.courseId);
    if (!courseId) return;
    const subtasks = readSubtasksFromEditor(editingTask && editingTask.subtasks);
    const payload = {
      title: String(fd.get('title') || '').trim(),
      due: String(fd.get('due') || ''),
      priority: String(fd.get('priority') || 'normal'),
      detail: String(fd.get('detail') || '').trim(),
      subtasks,
    };
    if (!payload.title) return;
    if (editingTask && editingTask.id) {
      const t = data.tasks.find(t => t.id === editingTask.id);
      if (t) Object.assign(t, payload);
    } else {
      const order = data.tasks.filter(t => t.courseId === courseId).length;
      data.tasks.push({
        id: MoyStorage.uid('tsk'),
        courseId, order, done: false,
        createdAt: Date.now(),
        ...payload,
      });
    }
    persist();
    $('#taskModal').hidden = true;
    renderAll();
    MoyNotify.toast({ title: editingTask ? 'Tugas diperbarui' : 'Tugas ditambahkan', message: payload.title, type: 'success' });
    editingTask = null;
  }
  function confirmDeleteTask(task) {
    openConfirm({
      title: 'Hapus tugas?',
      text: `Tugas "${task.title}" akan dihapus.`,
      onOk: () => {
        data.tasks = data.tasks.filter(t => t.id !== task.id);
        persist(); renderAll();
        MoyNotify.toast({ title: 'Tugas dihapus', message: task.title, type: 'warn' });
      }
    });
  }

  // ===========================================================
  //                   CONFIRM MODAL
  // ===========================================================
  function openConfirm({ title, text, onOk }) {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmModal').hidden = false;
    const ok = $('#confirmOk');
    const fresh = ok.cloneNode(true);
    ok.parentNode.replaceChild(fresh, ok);
    fresh.addEventListener('click', () => {
      $('#confirmModal').hidden = true;
      onOk && onOk();
    });
  }

  // ===========================================================
  //                   DRAG-AND-DROP COMMIT
  // ===========================================================
  function handleDndCommit({ type, id, toContainer, beforeId }) {
    if (type === 'task') {
      const t = data.tasks.find(x => x.id === id);
      if (!t) return;
      const newCourseId = toContainer.dataset.courseId;
      if (!newCourseId) return;
      const siblings = data.tasks
        .filter(x => x.courseId === newCourseId && x.id !== id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const beforeIndex = beforeId ? siblings.findIndex(x => x.id === beforeId) : siblings.length;
      const insertAt = beforeIndex === -1 ? siblings.length : beforeIndex;
      siblings.splice(insertAt, 0, t);
      t.courseId = newCourseId;
      siblings.forEach((s, i) => { s.order = i; });
      const oldGroups = {};
      data.tasks.forEach(x => {
        if (x.courseId === newCourseId) return;
        (oldGroups[x.courseId] = oldGroups[x.courseId] || []).push(x);
      });
      Object.values(oldGroups).forEach(arr => {
        arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
           .forEach((x, i) => { x.order = i; });
      });
      // Saat user manual drag, kembali ke mode manual sort
      if (sortMode !== 'manual') {
        sortMode = 'manual';
        if ($('#sortSelect')) $('#sortSelect').value = 'manual';
        settings.sortMode = 'manual';
        persistSettings();
      }
      persist(); renderAll();
    } else if (type === 'course') {
      const c = data.courses.find(x => x.id === id);
      if (!c) return;
      const newDayId = toContainer.dataset.dayId;
      if (!newDayId) return;
      const siblings = data.courses
        .filter(x => x.dayId === newDayId && x.id !== id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const beforeIndex = beforeId ? siblings.findIndex(x => x.id === beforeId) : siblings.length;
      const insertAt = beforeIndex === -1 ? siblings.length : beforeIndex;
      siblings.splice(insertAt, 0, c);
      c.dayId = newDayId;
      siblings.forEach((s, i) => { s.order = i; });
      const groups = {};
      data.courses.forEach(x => {
        if (x.dayId === newDayId) return;
        (groups[x.dayId] = groups[x.dayId] || []).push(x);
      });
      Object.values(groups).forEach(arr => {
        arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
           .forEach((x, i) => { x.order = i; });
      });
      persist(); renderAll();
    }
  }

  // ===========================================================
  //                   REMINDER LOOP
  // ===========================================================
  function runReminders() {
    settings = MoyNotify.checkReminders(data, settings);
    persistSettings();
  }

  // ===========================================================
  //                   UTIL
  // ===========================================================
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/`/g, '&#96;');
  }
  function labelPriority(p) {
    return p === 'high' ? 'Tinggi' : p === 'low' ? 'Rendah' : 'Normal';
  }
  function formatDue(due) {
    if (!due) return { html: '' };
    const date = new Date(due);
    if (Number.isNaN(date.getTime())) return { html: '' };
    const now = new Date();
    const diffMin = (date.getTime() - now.getTime()) / 60000;
    const txt = date.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    let cls = '';
    if (diffMin < 0) cls = 'overdue';
    else if (diffMin <= 60 * 24) cls = 'soon';
    return { html: `<span class="due-pill ${cls}">${escapeHtml(txt)}</span>` };
  }
})();
