(() => {
  'use strict';

  const data = window.PRESENTATION_DATA;
  const els = {
    connection: document.querySelector('.connection'),
    connectionLabel: document.getElementById('connectionLabel'),
    currentPosition: document.getElementById('currentPosition'),
    nextPosition: document.getElementById('nextPosition'),
    currentPreview: document.getElementById('currentPreview'),
    nextPreview: document.getElementById('nextPreview'),
    notes: document.getElementById('notesList'),
    speaker: document.getElementById('speakerLabel'),
    chapterDuration: document.getElementById('chapterDuration'),
    timer: document.getElementById('presenterTimer'),
    timerStatus: document.getElementById('timerStatus'),
    totalElapsed: document.getElementById('totalElapsed'),
    timerToggle: document.getElementById('timerToggle'),
    timerReset: document.getElementById('timerReset'),
    timerTotalReset: document.getElementById('timerTotalReset'),
    minutes: document.getElementById('minutesInput'),
    seconds: document.getElementById('secondsInput'),
    applyTime: document.getElementById('applyTime'),
    autoReset: document.getElementById('autoResetToggle'),
    prevChapter: document.getElementById('prevChapter'),
    prevSlide: document.getElementById('prevSlide'),
    nextSlide: document.getElementById('nextSlide'),
    nextChapter: document.getElementById('nextChapter'),
    blackout: document.getElementById('blackoutButton'),
    fullscreen: document.getElementById('fullscreenRemote'),
    returnStart: document.getElementById('returnStart')
  };

  const savedSettings = (() => {
    try { return JSON.parse(localStorage.getItem('cedrus-presenter-settings') || '{}'); } catch (_) { return {}; }
  })();

  const state = {
    chapterIndex: 0,
    slideIndex: 0,
    viewType: 'cover',
    connected: false,
    remaining: 240,
    running: false,
    totalElapsed: Number(savedSettings.totalElapsed) || 0,
    autoReset: savedSettings.autoReset !== false,
    customDurations: savedSettings.customDurations || {},
    lastChapterIndex: 0
  };

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('cedrus-presentation') : null;
  let timerInterval = null;
  let heartbeatTimeout = null;

  const pad = value => String(value).padStart(2, '0');
  const formatTime = seconds => `${pad(Math.floor(Math.max(0, seconds) / 60))}:${pad(Math.max(0, seconds) % 60)}`;
  const formatTotal = seconds => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
  const escapeHtml = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function chapter() { return data.chapters[state.chapterIndex]; }
  function slide() { return chapter().slides[state.slideIndex]; }

  function getFloatingPlacement(item) {
    const media = Array.isArray(item?.floatingMedia) ? item.floatingMedia : [];
    if (!media.length) return 'none';
    if (['side', 'scene'].includes(item.floatingPlacement)) return item.floatingPlacement;
    const layoutsWithRoom = new Set(['hero', 'statement', 'quote', 'finale']);
    return media.length === 1 && layoutsWithRoom.has(item.layout) ? 'side' : 'scene';
  }

  function hasDedicatedMediaScene(item) {
    return getFloatingPlacement(item) === 'scene';
  }
  function getDuration(index = state.chapterIndex) {
    const key = String(data.chapters[index].number);
    return Number(state.customDurations[key]) || data.chapters[index].duration * 60;
  }

  function nextPosition() {
    const ch = chapter();
    const currentItem = ch.slides[state.slideIndex];

    if (state.viewType === 'cover') {
      return { viewType: 'intro', chapterIndex: 0, slideIndex: 0 };
    }

    if (state.viewType === 'intro') {
      return { viewType: 'slide', chapterIndex: state.chapterIndex, slideIndex: 0 };
    }

    if (state.viewType === 'slide' && hasDedicatedMediaScene(currentItem)) {
      return { viewType: 'media', chapterIndex: state.chapterIndex, slideIndex: state.slideIndex };
    }

    if (state.slideIndex < ch.slides.length - 1) {
      return { viewType: 'slide', chapterIndex: state.chapterIndex, slideIndex: state.slideIndex + 1 };
    }

    if (state.chapterIndex < data.chapters.length - 1) {
      return { viewType: 'intro', chapterIndex: state.chapterIndex + 1, slideIndex: 0 };
    }

    return { viewType: state.viewType, chapterIndex: state.chapterIndex, slideIndex: state.slideIndex };
  }

  function heading(item) { return item.title || item.quote || item.subtitle || 'Momento visual'; }
  function body(item) { return item.body || item.subtitle || item.caption || item.attribution || ''; }

  function previewMarkup(item, ch) {
    return `<small>${escapeHtml(item.eyebrow || ch.eyebrow || ch.title)}</small><h2>${escapeHtml(heading(item)).replaceAll('\n','<br>')}</h2>${body(item) ? `<p>${escapeHtml(body(item))}</p>` : ''}`;
  }

  function introPreviewMarkup(ch) {
    return `<small>INTRODUCCIÓN DE SECCIÓN</small><h2>${escapeHtml(ch.title)}</h2><p>${escapeHtml(ch.eyebrow || ch.speaker)}</p>`;
  }

  function coverPreviewMarkup() {
    return `<small>PORTADA</small><h2>${escapeHtml(data.meta.title)}</h2><p>${escapeHtml(data.meta.subtitle)} · ${escapeHtml(data.meta.period)}</p>`;
  }

  function mediaPreviewMarkup(item, ch) {
    const count = item.floatingMedia?.length || 0;
    return `<small>EVIDENCIA VISUAL</small><h2>${escapeHtml(item.floatingTitle || 'Fotografías de contexto')}</h2><p>${count} ${count === 1 ? 'fotografía' : 'fotografías'} · ${escapeHtml(ch.title)}</p>`;
  }

  function renderPreview(position) {
    const ch = data.chapters[position.chapterIndex];
    if (position.viewType === 'cover') return coverPreviewMarkup();
    if (position.viewType === 'intro') return introPreviewMarkup(ch);
    if (position.viewType === 'media') return mediaPreviewMarkup(ch.slides[position.slideIndex], ch);
    return previewMarkup(ch.slides[position.slideIndex], ch);
  }

  function render() {
    const ch = chapter();
    const item = slide();
    const next = nextPosition();
    const nextCh = data.chapters[next.chapterIndex];

    if (state.viewType === 'cover') {
      els.currentPosition.textContent = 'PORTADA';
      els.currentPreview.innerHTML = coverPreviewMarkup();
    } else if (state.viewType === 'intro') {
      els.currentPosition.textContent = `${pad(ch.number)} · INTRO`;
      els.currentPreview.innerHTML = introPreviewMarkup(ch);
    } else if (state.viewType === 'media') {
      els.currentPosition.textContent = `${pad(ch.number)} · FOTOS`;
      els.currentPreview.innerHTML = mediaPreviewMarkup(item, ch);
    } else {
      els.currentPosition.textContent = `${pad(ch.number)} · ${pad(state.slideIndex + 1)}`;
      els.currentPreview.innerHTML = previewMarkup(item, ch);
    }

    els.nextPosition.textContent = next.viewType === 'intro'
      ? `${pad(nextCh.number)} · INTRO`
      : next.viewType === 'cover'
        ? 'PORTADA'
        : next.viewType === 'media'
          ? `${pad(nextCh.number)} · FOTOS`
          : `${pad(nextCh.number)} · ${pad(next.slideIndex + 1)}`;
    els.nextPreview.innerHTML = renderPreview(next);
    els.speaker.textContent = state.viewType === 'cover' ? data.meta.organization : ch.speaker;
    els.chapterDuration.textContent = `${Math.round(getDuration() / 60)} min`;

    const notes = state.viewType === 'cover'
      ? ['Dar inicio a la experiencia y preparar al público para el recorrido institucional.']
      : state.viewType === 'intro'
        ? [`Presentar la sección ${ch.title} y dar paso a ${ch.speaker}.`, ...(ch.slides[0]?.notes || []).slice(0, 2)]
        : state.viewType === 'media'
          ? ['Permitir que las fotografías permanezcan visibles unos segundos.', 'Relacionar las imágenes con el logro o actividad presentada en el momento anterior.']
          : (item.notes?.length ? item.notes : ['Pausa breve y conectar este momento con el siguiente.']);

    els.notes.innerHTML = notes
      .map((note, index) => `<div class="note-item"><span>${pad(index + 1)}</span><div>${escapeHtml(note)}</div></div>`).join('');

    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    els.timer.textContent = formatTime(state.remaining);
    els.totalElapsed.textContent = formatTotal(state.totalElapsed);
    els.timerToggle.textContent = state.running ? 'Pausar' : 'Iniciar';
    els.timerStatus.textContent = state.running ? 'En curso' : state.remaining === 0 ? 'Tiempo concluido' : 'Listo';
    els.timer.style.color = state.remaining <= 20 ? '#ff7474' : state.remaining <= 60 ? '#ffc56f' : '';
  }

  function saveSettings() {
    localStorage.setItem('cedrus-presenter-settings', JSON.stringify({
      autoReset: state.autoReset,
      customDurations: state.customDurations,
      totalElapsed: state.totalElapsed
    }));
  }

  function broadcastTimer() {
    const payload = { type: 'timer', remaining: state.remaining, running: state.running, totalElapsed: state.totalElapsed, timestamp: Date.now() };
    channel?.postMessage(payload);
    localStorage.setItem('cedrus-timer', JSON.stringify(payload));
  }

  function setConnected() {
    state.connected = true;
    els.connection.classList.add('is-online');
    els.connectionLabel.textContent = 'Presentación conectada';
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = setTimeout(() => {
      state.connected = false;
      els.connection.classList.remove('is-online');
      els.connectionLabel.textContent = 'Esperando presentación…';
    }, 5000);
  }

  function receive(message) {
    if (!message || typeof message !== 'object') return;
    if (message.type !== 'state') return;
    setConnected();
    const chapterChanged = Number(message.chapterIndex) !== state.chapterIndex;
    state.lastChapterIndex = state.chapterIndex;
    state.chapterIndex = Math.max(0, Math.min(data.chapters.length - 1, Number(message.chapterIndex) || 0));
    state.slideIndex = Math.max(0, Math.min(chapter().slides.length - 1, Number(message.slideIndex) || 0));
    state.viewType = ['cover', 'intro', 'slide', 'media'].includes(message.viewType) ? message.viewType : 'slide';
    if (chapterChanged && state.autoReset) resetChapterTimer(false);
    render();
  }

  function createMessageId(prefix = 'cmd') {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function sendCommand(action, extra = {}) {
    const payload = {
      type: 'command',
      action,
      ...extra,
      commandId: createMessageId(action),
      timestamp: Date.now()
    };

    // Se envía por ambos canales para conservar compatibilidad. La pantalla
    // principal descarta automáticamente el segundo mensaje con commandId.
    channel?.postMessage(payload);
    localStorage.setItem('cedrus-command', JSON.stringify(payload));
  }

  function resetChapterTimer(broadcast = true) {
    state.remaining = getDuration();
    state.running = false;
    stopInterval();
    els.minutes.value = Math.floor(state.remaining / 60);
    els.seconds.value = state.remaining % 60;
    updateTimerDisplay();
    if (broadcast) broadcastTimer();
  }

  function stopInterval() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function startInterval() {
    stopInterval();
    timerInterval = setInterval(() => {
      if (!state.running) return;
      if (state.remaining > 0) state.remaining -= 1;
      state.totalElapsed += 1;
      if (state.remaining <= 0) {
        state.remaining = 0;
        state.running = false;
        stopInterval();
      }
      updateTimerDisplay();
      saveSettings();
      broadcastTimer();
    }, 1000);
  }

  els.timerToggle.addEventListener('click', () => {
    if (state.remaining <= 0) resetChapterTimer(false);
    state.running = !state.running;
    if (state.running) startInterval(); else stopInterval();
    updateTimerDisplay();
    broadcastTimer();
  });
  els.timerReset.addEventListener('click', () => resetChapterTimer(true));
  els.timerTotalReset.addEventListener('click', () => {
    state.totalElapsed = 0;
    saveSettings();
    updateTimerDisplay();
    broadcastTimer();
  });
  els.applyTime.addEventListener('click', () => {
    const seconds = Math.max(0, (Number(els.minutes.value) || 0) * 60 + Math.min(59, Number(els.seconds.value) || 0));
    state.customDurations[String(chapter().number)] = seconds;
    state.remaining = seconds;
    state.running = false;
    stopInterval();
    saveSettings();
    render();
    broadcastTimer();
  });
  els.autoReset.checked = state.autoReset;
  els.autoReset.addEventListener('change', () => { state.autoReset = els.autoReset.checked; saveSettings(); });

  els.prevChapter.addEventListener('click', () => sendCommand('prevChapter'));
  els.prevSlide.addEventListener('click', () => sendCommand('prevSlide'));
  els.nextSlide.addEventListener('click', () => sendCommand('nextSlide'));
  els.nextChapter.addEventListener('click', () => sendCommand('nextChapter'));
  els.blackout.addEventListener('click', () => sendCommand('blackout'));
  els.fullscreen.addEventListener('click', () => sendCommand('fullscreen'));
  els.returnStart.addEventListener('click', () => sendCommand('goStart'));

  window.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (['arrowright', 'arrowdown', ' '].includes(event.key.toLowerCase())) { event.preventDefault(); sendCommand('nextSlide'); }
    else if (['arrowleft', 'arrowup'].includes(event.key.toLowerCase())) { event.preventDefault(); sendCommand('prevSlide'); }
  });

  channel?.addEventListener('message', event => receive(event.data));
  window.addEventListener('storage', event => {
    if (event.key === 'cedrus-state' && event.newValue) {
      try { receive(JSON.parse(event.newValue)); } catch (_) {}
    }
  });

  try {
    const existing = JSON.parse(localStorage.getItem('cedrus-state') || 'null');
    if (existing) receive(existing);
  } catch (_) {}

  state.remaining = getDuration();
  els.minutes.value = Math.floor(state.remaining / 60);
  els.seconds.value = state.remaining % 60;
  render();
  channel?.postMessage({ type: 'requestState', timestamp: Date.now() });
  localStorage.setItem('cedrus-command', JSON.stringify({ type: 'requestState', timestamp: Date.now() }));
})();
