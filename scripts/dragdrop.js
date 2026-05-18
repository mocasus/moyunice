/* ============================================================
   MoyUNNES - dragdrop.js
   Drag-and-drop interaktif & smooth untuk:
     - Mengubah urutan course di dalam day
     - Memindah course antar day
     - Mengubah urutan task di dalam course
     - Memindah task antar course
   Menggunakan HTML5 Drag & Drop API ditambah placeholder.
   ============================================================ */
(function (global) {
  'use strict';

  const state = {
    type: null,          // 'course' | 'task'
    id: null,
    fromDayId: null,
    fromCourseId: null,
    placeholder: null,
    onCommit: null,      // callback({type, id, toContainer, beforeId})
  };

  function makePlaceholder(refEl) {
    const ph = document.createElement('div');
    ph.className = 'drop-placeholder';
    if (refEl) {
      const h = refEl.getBoundingClientRect().height;
      ph.style.height = Math.max(40, Math.round(h)) + 'px';
    }
    return ph;
  }

  function clearPlaceholder() {
    if (state.placeholder && state.placeholder.parentNode) {
      state.placeholder.parentNode.removeChild(state.placeholder);
    }
    state.placeholder = null;
  }

  /** Cari elemen yang ada di bawah cursor untuk menentukan posisi sisip */
  function getInsertBeforeElement(container, y, selector) {
    const items = [...container.querySelectorAll(selector)].filter(
      el => !el.classList.contains('dragging')
    );
    for (const el of items) {
      const box = el.getBoundingClientRect();
      const middle = box.top + box.height / 2;
      if (y < middle) return el;
    }
    return null; // append at end
  }

  function attach(rootEl, callbacks) {
    state.onCommit = callbacks.onCommit;

    // ===== drag start =====
    rootEl.addEventListener('dragstart', (ev) => {
      const taskEl = ev.target.closest('.task-item');
      const courseEl = ev.target.closest('.course-card');
      if (taskEl) {
        state.type = 'task';
        state.id = taskEl.dataset.id;
        state.fromCourseId = taskEl.dataset.courseId;
        state.fromDayId = null;
        ev.dataTransfer.effectAllowed = 'move';
        try { ev.dataTransfer.setData('text/plain', state.id); } catch {}
        requestAnimationFrame(() => taskEl.classList.add('dragging'));
      } else if (courseEl) {
        state.type = 'course';
        state.id = courseEl.dataset.id;
        state.fromDayId = courseEl.dataset.dayId;
        state.fromCourseId = null;
        ev.dataTransfer.effectAllowed = 'move';
        try { ev.dataTransfer.setData('text/plain', state.id); } catch {}
        requestAnimationFrame(() => courseEl.classList.add('dragging'));
      }
    });

    // ===== drag over (untuk menampilkan placeholder) =====
    rootEl.addEventListener('dragover', (ev) => {
      if (!state.type) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';

      if (state.type === 'task') {
        const taskList = ev.target.closest('.task-list');
        if (!taskList) return;
        const draggingEl = rootEl.querySelector('.task-item.dragging');
        if (!state.placeholder) state.placeholder = makePlaceholder(draggingEl);
        const before = getInsertBeforeElement(taskList, ev.clientY, '.task-item');
        if (before) taskList.insertBefore(state.placeholder, before);
        else taskList.appendChild(state.placeholder);
        // visual hint
        rootEl.querySelectorAll('.task-list.drag-over').forEach(el => el.classList.remove('drag-over'));
        taskList.classList.add('drag-over');
      } else if (state.type === 'course') {
        const list = ev.target.closest('.course-list');
        const column = ev.target.closest('.day-column');
        if (!list) return;
        const draggingEl = rootEl.querySelector('.course-card.dragging');
        if (!state.placeholder) state.placeholder = makePlaceholder(draggingEl);
        const before = getInsertBeforeElement(list, ev.clientY, '.course-card');
        if (before) list.insertBefore(state.placeholder, before);
        else list.appendChild(state.placeholder);
        rootEl.querySelectorAll('.day-column.drag-over').forEach(el => el.classList.remove('drag-over'));
        if (column) column.classList.add('drag-over');
      }
    });

    rootEl.addEventListener('dragleave', (ev) => {
      // bersihkan highlight bila keluar dari rootEl
      if (!ev.relatedTarget || !rootEl.contains(ev.relatedTarget)) {
        rootEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      }
    });

    // ===== drop =====
    rootEl.addEventListener('drop', (ev) => {
      if (!state.type) return;
      ev.preventDefault();

      let toContainer = null;
      let beforeId = null;
      if (state.placeholder && state.placeholder.parentNode) {
        toContainer = state.placeholder.parentNode;
        const next = state.placeholder.nextElementSibling;
        if (next && (next.classList.contains('task-item') || next.classList.contains('course-card'))) {
          beforeId = next.dataset.id;
        }
      }

      cleanupDragState(rootEl);

      if (state.onCommit && toContainer) {
        state.onCommit({
          type: state.type,
          id: state.id,
          fromDayId: state.fromDayId,
          fromCourseId: state.fromCourseId,
          toContainer,
          beforeId,
        });
      }
      resetState();
    });

    // ===== drag end (cleanup bila batal) =====
    rootEl.addEventListener('dragend', () => {
      cleanupDragState(rootEl);
      resetState();
    });
  }

  function cleanupDragState(rootEl) {
    rootEl.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    rootEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    clearPlaceholder();
  }

  function resetState() {
    state.type = null;
    state.id = null;
    state.fromDayId = null;
    state.fromCourseId = null;
  }

  global.MoyDnd = { attach };
})(window);
