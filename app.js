(() => {
  'use strict';

  const data = window.PRESENTATION_DATA;
  if (!data?.chapters?.length) throw new Error('No se encontró la información de la presentación.');

  const CONFIG = window.CEDRUS_PRESENTATION_CONFIG || {};
  const timingConfig = {
    standardTransitionDurationMs: 2400,
    lockInputDuringTransition: true,
    ...(CONFIG.timing || {})
  };
  const standardTransitionDurationMs = Math.max(600, Number(timingConfig.standardTransitionDurationMs) || 2400);
  const smoothScrollConfig = {
    enabled: true,
    wheelMode: 'scene',
    wheelStepThresholdPx: 46,
    wheelGestureCooldownMs: 360,
    wheelMultiplier: 0.50,
    wheelMaxStepPx: 180,
    response: 7.4,
    maxSpeedPxPerSecond: 1320,
    navigationDurationMs: standardTransitionDurationMs,
    navigationEase: 'sine',
    stopThresholdPx: 0.08,
    ...(CONFIG.smoothScroll || {}),
    navigationDurationMs: standardTransitionDurationMs
  };
  const transitionConfig = {
    sceneScrollHeightVh: 188,
    chapterIntroScrollHeightVh: 160,
    coverScrollHeightVh: 196,
    mobileSceneScrollHeightVh: 150,
    mobileChapterIntroScrollHeightVh: 132,
    mobileCoverScrollHeightVh: 164,
    enterStart: 0.015,
    enterEnd: 0.34,
    exitStart: 0.66,
    exitEnd: 0.985,
    itemEnterStart: 0.045,
    itemEnterEnd: 0.33,
    itemExitStart: 0.69,
    itemExitEnd: 0.975,
    itemStagger: 0.012,
    visualResponse: 7.2,
    visibilityThreshold: 0.025,
    focusThreshold: 0.68,
    ...(CONFIG.transition || {})
  };
  const motionConfig = {
    horizontalDistancePx: 82,
    verticalDistancePx: 62,
    sceneBlurPx: 10,
    itemBlurPx: 5,
    centerOutStartScale: 0.90,
    centerOutExitScale: 1.065,
    centerInStartScale: 1.065,
    centerInExitScale: 0.92,
    ...(CONFIG.motion || {})
  };
  const styleSequence = Array.isArray(CONFIG.styleSequence) && CONFIG.styleSequence.length
    ? CONFIG.styleSequence
    : ['top-down', 'left-right', 'right-left', 'center-out', 'center-in'];

  const els = {
    scrollRoot: document.getElementById('scrollRoot'),
    presenter: document.getElementById('presenterButton'),
    fullscreen: document.getElementById('fullscreenButton'),
    chapterCounter: document.getElementById('chapterCounter'),
    chapterTitle: document.getElementById('chapterTitle'),
    speaker: document.getElementById('speakerName'),
    slideCounter: document.getElementById('slideCounter'),
    blackout: document.getElementById('blackout'),
    help: document.getElementById('shortcutHelp'),
    canvas: document.getElementById('ambientCanvas'),
    cursorGlow: document.getElementById('cursorGlow')
  };

  const state = {
    chapterIndex: 0,
    slideIndex: 0,
    viewType: 'cover',
    mediaGroupIndex: 0,
    mediaGroupCount: 1,
    timerRemaining: data.chapters[0].duration * 60,
    timerRunning: false,
    blackout: false,
    started: true
  };

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('cedrus-presentation') : null;

  // BroadcastChannel y localStorage se usan en paralelo como respaldo entre
  // ventanas. Este registro evita ejecutar dos veces el mismo comando.
  const processedCommandIds = new Set();

  function isDuplicateCommand(message) {
    if (message?.type !== 'command') return false;

    const commandId = message.commandId || `${message.action || 'command'}:${message.timestamp || 0}`;
    if (processedCommandIds.has(commandId)) return true;

    processedCommandIds.add(commandId);
    window.setTimeout(() => processedCommandIds.delete(commandId), 10000);
    return false;
  }
  const blocks = [];
  const navigationScenes = [];
  const chapterIntroIndices = [];
  let activeFlatIndex = 0;
  let activeNavigationIndex = 0;
  let navigationCursorIndex = 0;
  const scrubScenes = [];
  let cinematicScroll = null;
  let fallbackScrubFrame = null;
  let resizeFrame = null;

  const pad = value => String(value).padStart(2, '0');
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const hexToRgb = hex => {
    const clean = String(hex || '#52a536').replace('#', '');
    const normalized = clean.length === 3 ? clean.split('').map(x => x + x).join('') : clean;
    const num = parseInt(normalized, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  function getSlideTitle(slide) {
    return slide.title || slide.quote || slide.subtitle || slide.eyebrow || 'Momento';
  }

  function getSlideBody(slide) {
    return slide.body || slide.subtitle || slide.caption || slide.attribution || '';
  }

  // Decide cómo se presentan las fotografías adicionales sin saturar la escena.
  // - side: una fotografía acompaña al contenido en una columna lateral.
  // - scene: se crea un momento visual independiente para dar espacio completo.
  function getFloatingMediaGroups(slide) {
    const groups = Array.isArray(slide?.floatingMediaGroups)
      ? slide.floatingMediaGroups.filter(group => Array.isArray(group?.media) && group.media.length)
      : [];
    if (groups.length) return groups;

    const media = Array.isArray(slide?.floatingMedia) ? slide.floatingMedia : [];
    return media.length ? [{ media, layout: slide.floatingLayout }] : [];
  }

  function getFloatingPlacement(slide) {
    const groups = getFloatingMediaGroups(slide);
    if (!groups.length) return 'none';
    if (groups.length > 1) return 'scene';
    if (['side', 'scene'].includes(slide.floatingPlacement)) return slide.floatingPlacement;

    const media = groups[0].media;
    const layoutsWithRoom = new Set(['hero', 'statement', 'quote', 'finale']);
    return media.length === 1 && layoutsWithRoom.has(slide.layout) ? 'side' : 'scene';
  }

  function getFloatingSide(layoutVariant, flatIndex) {
    if (layoutVariant === 'layout-left') return 'right';
    if (layoutVariant === 'layout-right') return 'left';
    return flatIndex % 2 === 0 ? 'right' : 'left';
  }

  function hasDedicatedMediaScene(slide) {
    return getFloatingPlacement(slide) === 'scene';
  }

  function currentChapter() {
    return data.chapters[state.chapterIndex];
  }

  function currentSlide() {
    return currentChapter().slides[state.slideIndex];
  }

  function updateTheme(chapterIndex = state.chapterIndex) {
    const accent = data.chapters[chapterIndex]?.accent || '#52a536';
    const rgb = hexToRgb(accent);
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-rgb', rgb.join(','));
  }

  function createMetricList(metrics = []) {
    return `<div class="metrics-grid anim-grid anim-metrics-grid">${metrics.map(metric => `
      <article class="metric-card reveal-item anim-item anim-metric">
        <strong>${escapeHtml(metric.value)}</strong>
        <span>${escapeHtml(metric.label)}</span>
      </article>`).join('')}
    </div>`;
  }

  function createCardList(cards = []) {
    return `<div class="mosaic-grid anim-grid anim-cards-grid">${cards.map(card => `
      <article class="glass-card reveal-item anim-item anim-card">
        <h4>${escapeHtml(card.title)}</h4>
        <p>${escapeHtml(card.text)}</p>
      </article>`).join('')}
    </div>`;
  }

  function createProjects(projects = []) {
    return `<div class="stack-grid anim-grid anim-projects-grid">${projects.map(project => `
      <article class="glass-card project-card reveal-item anim-item anim-card anim-project-card">
        <h4>${escapeHtml(project.title)}</h4>
        <p>${escapeHtml(project.text)}</p>
      </article>`).join('')}
    </div>`;
  }

  function createPillars(pillars = []) {
    return `<div class="pillars-grid anim-grid anim-pillars-grid">${pillars.map(item => `
      <article class="pillar-card reveal-item anim-item anim-pillar">
        <span class="pillar-index anim-badge">${escapeHtml(item.index)}</span>
        <div>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.text)}</p>
        </div>
      </article>`).join('')}</div>`;
  }

  function createFlow(steps = []) {
    return `<div class="flow-grid anim-grid anim-flow-grid">${steps.map((item, index) => `
      <article class="flow-step reveal-item anim-item anim-flow-step">
        <span class="flow-number anim-badge">${pad(index + 1)}</span>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.text)}</p>
      </article>`).join('')}</div>`;
  }

  function createTimeline(timeline = [], footer = '') {
    return `<div class="timeline-grid anim-grid anim-timeline-grid">${timeline.map(item => `
      <article class="timeline-card reveal-item anim-item anim-timeline-card">
        <small>${escapeHtml(item.label)}</small>
        <strong>${escapeHtml(item.value)}</strong>
        <p>${escapeHtml(item.text)}</p>
      </article>`).join('')}</div>${footer ? `<div class="section-footnote reveal-item anim-item anim-footnote">${escapeHtml(footer)}</div>` : ''}`;
  }

  function createSplit(slide) {
    return `<div class="split-grid anim-grid anim-split-grid">
      <article class="glass-card reveal-item anim-item anim-card">
        <small>${escapeHtml(slide.leftTitle)}</small>
        <h4>${escapeHtml(slide.leftTitle)}</h4>
        <p>${escapeHtml(slide.leftText)}</p>
      </article>
      <article class="glass-card reveal-item anim-item anim-card">
        <small>${escapeHtml(slide.rightTitle)}</small>
        <h4>${escapeHtml(slide.rightTitle)}</h4>
        <p>${escapeHtml(slide.rightText)}</p>
      </article>
    </div>`;
  }

  function createGallery(media = [], caption = '') {
    return `<div class="gallery-grid floating-gallery anim-grid anim-gallery-grid">${media.map((item, index) => `
      <article class="media-card reveal-item anim-item anim-media">
        <div class="media-card__surface floating-photo__surface" data-media-key="${escapeHtml(item.key || '')}" style="--float-delay:${index * -1.7}s;--float-rotate:${index % 2 ? '1.1deg' : '-1.1deg'}">
          <div class="media-overlay anim-media-overlay">
            <span>${escapeHtml(item.label || 'Evidencia visual')}</span>
            <small>${escapeHtml(item.caption || 'Fotografía del informe anual')}</small>
          </div>
        </div>
      </article>`).join('')}</div>${caption ? `<div class="section-footnote reveal-item anim-item anim-footnote">${escapeHtml(caption)}</div>` : ''}`;
  }

  function createFloatingMedia(media = [], layout = 'single-wide', mode = 'inline') {
    if (!Array.isArray(media) || !media.length) return '';

    const layoutClass = `floating-layout-${escapeHtml(layout)}`;
    const modeClass = mode === 'side'
      ? 'floating-media-side'
      : mode === 'showcase'
        ? 'floating-media-showcase'
        : 'floating-media-inline';

    return `<div class="floating-media-stage ${layoutClass} floating-count-${media.length} ${modeClass} anim-grid" data-floating-layout="${escapeHtml(layout)}" data-floating-mode="${escapeHtml(mode)}">
      ${media.map((item, index) => `
        <figure class="floating-photo floating-photo-${index + 1} reveal-item anim-item anim-media" style="--photo-index:${index + 1};--photo-count:${media.length};">
          <div class="floating-photo__surface" data-media-key="${escapeHtml(item.key || '')}" style="--float-delay:${index * -1.85}s;--float-rotate:${index % 2 ? '1.2deg' : '-1.1deg'};--float-distance:${9 + index * 2}px">
            <div class="floating-photo__glow" aria-hidden="true"></div>
            <figcaption class="floating-photo__caption">
              <strong>${escapeHtml(item.label || 'Evidencia visual')}</strong>
              ${item.caption ? `<span>${escapeHtml(item.caption)}</span>` : ''}
            </figcaption>
          </div>
        </figure>`).join('')}
    </div>`;
  }

  function createPhotoShowcase(slide, chapter, chapterIndex, slideIndex) {
    if (!hasDedicatedMediaScene(slide)) return '';

    const groups = getFloatingMediaGroups(slide);
    const groupCount = groups.length;
    const title = slide.floatingTitle || 'Evidencias que dan contexto';
    const subtitle = slide.floatingSubtitle || `Momentos destacados de ${chapter.title}`;

    return groups.map((group, groupIndex) => {
      const media = group.media || [];
      const layout = group.layout || slide.floatingLayout || (media.length >= 3 ? 'collage' : media.length === 2 ? 'duo-overlap' : 'single-wide');
      const sceneSuffix = groupCount > 1 ? `-${pad(groupIndex + 1)}` : '';
      const counter = groupCount > 1 ? ` · ${groupIndex + 1}/${groupCount}` : '';

      return `
        <article class="photo-showcase-scene scroll-scene anim-block scene-${chapter.id}-${pad(slideIndex + 1)}-fotos${sceneSuffix} scroll-motion-center-out"
          data-chapter-index="${chapterIndex}"
          data-slide-index="${slideIndex}"
          data-view-type="media"
          data-media-group-index="${groupIndex}"
          data-media-group-count="${groupCount}"
          data-animation-scene="${chapter.id}-${pad(slideIndex + 1)}-fotos${sceneSuffix}"
          data-scroll-scene="${chapter.id}-${pad(slideIndex + 1)}-fotos${sceneSuffix}"
          data-scroll-style="center-out">
          <div class="photo-showcase__content scroll-scene__content anim-content">
            <header class="photo-showcase__header reveal-item anim-content-head">
              <div class="eyebrow anim-eyebrow">${pad(chapter.number)}.${pad(slideIndex + 1)} · EVIDENCIA VISUAL${counter}</div>
              <h3 class="section-title anim-title">${escapeHtml(group.title || title)}</h3>
              <p class="body-copy anim-copy">${escapeHtml(group.subtitle || subtitle)}</p>
            </header>
            ${createFloatingMedia(media, layout, 'showcase')}
          </div>
        </article>`;
    }).join('');
  }

  function renderBlockContent(slide, chapter, flatIndex) {
    const eyebrow = slide.eyebrow || chapter.eyebrow || chapter.title;
    const title = escapeHtml(slide.title || '').replaceAll('\n', '<br>');
    const body = getSlideBody(slide);

    switch (slide.layout) {
      case 'hero':
        return `
          <div class="hero-panel reveal-item anim-panel anim-hero">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <div class="chapter-badge anim-badge">${pad(chapter.number)}</div>
            <h2 class="display-title anim-title">${title}</h2>
            ${slide.subtitle ? `<p class="lead-copy anim-copy">${escapeHtml(slide.subtitle)}</p>` : ''}
            ${slide.label ? `<div class="chip-row anim-chip-group"><span class="outline-chip anim-chip">${escapeHtml(slide.label)}</span></div>` : ''}
          </div>`;

      case 'statement':
        return `
          <article class="wide-statement reveal-item anim-panel anim-statement">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
            ${slide.body ? `<p class="body-copy anim-copy">${escapeHtml(slide.body)}</p>` : ''}
          </article>`;

      case 'cards':
        return `
          <div class="content-head reveal-item anim-content-head">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createCardList(slide.cards)}`;

      case 'metrics':
        return `
          <div class="content-head reveal-item anim-content-head align-right-head">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createMetricList(slide.metrics)}`;

      case 'pillars':
        return `
          <div class="content-head reveal-item anim-content-head">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createPillars(slide.pillars)}`;

      case 'projects':
        return `
          <div class="content-head reveal-item anim-content-head ${flatIndex % 2 ? 'align-right-head' : ''}">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createProjects(slide.projects)}`;

      case 'flow':
        return `
          <div class="content-head reveal-item anim-content-head">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createFlow(slide.steps)}`;

      case 'split':
        return `
          <div class="content-head reveal-item anim-content-head">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createSplit(slide)}`;

      case 'timeline':
        return `
          <div class="content-head reveal-item anim-content-head">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createTimeline(slide.timeline, slide.footer)}`;

      case 'gallery':
        return `
          <div class="content-head reveal-item anim-content-head align-right-head">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title}</h3>
          </div>
          ${createGallery(slide.media, slide.caption)}`;

      case 'quote':
        return `
          <article class="quote-panel reveal-item anim-panel anim-quote">
            <span class="quote-mark anim-quote-mark">“</span>
            <blockquote class="anim-quote-text">${escapeHtml(slide.quote)}</blockquote>
            ${slide.attribution ? `<div class="quote-attribution anim-copy">${escapeHtml(slide.attribution)}</div>` : ''}
          </article>`;

      case 'finale':
        return `
          <div class="hero-panel finale-panel reveal-item anim-panel anim-finale">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h2 class="display-title anim-title">${title}</h2>
            ${slide.subtitle ? `<p class="lead-copy anim-copy">${escapeHtml(slide.subtitle)}</p>` : ''}
            ${slide.label ? `<div class="chip-row anim-chip-group"><span class="outline-chip anim-chip">${escapeHtml(slide.label)}</span></div>` : ''}
          </div>`;

      default:
        return `
          <article class="wide-statement reveal-item anim-panel anim-statement">
            <div class="eyebrow anim-eyebrow">${escapeHtml(eyebrow)}</div>
            <h3 class="section-title anim-title">${title || escapeHtml(getSlideTitle(slide))}</h3>
            ${body ? `<p class="body-copy anim-copy">${escapeHtml(body)}</p>` : ''}
          </article>`;
    }
  }

  function hydrateMediaSlots(scope = document) {
    const extensions = ['webp', 'png', 'jpg', 'jpeg'];
    scope.querySelectorAll('[data-media-key]').forEach(slot => {
      const key = slot.dataset.mediaKey;
      if (!key) return;
      let index = 0;
      const probe = () => {
        if (index >= extensions.length) {
          slot.closest('.floating-photo, .media-card')?.classList.add('is-media-missing');
          return;
        }
        const src = `assets/${key}.${extensions[index++]}`;
        const image = new Image();
        image.onload = () => {
          slot.style.backgroundImage = `linear-gradient(180deg, rgba(4, 6, 16, .04), rgba(4, 6, 16, .58)), url("${src}")`;
          slot.classList.add('has-media');
          slot.closest('.floating-photo, .media-card')?.classList.add('has-media');
        };
        image.onerror = probe;
        image.src = src;
      };
      probe();
    });
  }

  // ANIMATION HOOKS:
  // Las clases únicas de sección y escena se asignan aquí, en renderStory().
  // Ejemplos: .section-daco, .scene-daco-01, .scene-layout-hero.
  // Las clases genéricas de elementos se asignan en renderBlockContent() y create*().
  function renderStory() {
    let flatIndex = 0;

    els.scrollRoot.innerHTML = `
      <section class="intro-hero scroll-scene scroll-scene--cover anim-section section-portada" data-animation-section="portada" data-scroll-scene="portada" data-view-type="cover" data-scroll-style="center-out">
        <div class="intro-hero__content scroll-scene__content reveal-item anim-section-header anim-hero">
          <div class="eyebrow anim-eyebrow">INSTITUTO CEDRUS · BACHILLERATO</div>
          <h1 class="anim-title">${escapeHtml(data.meta.title)}<br><em>${escapeHtml(data.meta.subtitle)}</em></h1>
          <p class="anim-copy">${escapeHtml(data.meta.period)} · Presentación ejecutiva inmersiva con navegación por scroll.</p>
          <div class="chip-row anim-chip-group">
            <span class="outline-chip anim-chip">${escapeHtml(data.meta.organization)}</span>
            <span class="outline-chip anim-chip">${escapeHtml(data.meta.theme)}</span>
            <span class="outline-chip anim-chip">Desplázate para continuar</span>
          </div>
        </div>
      </section>
      ${data.chapters.map((chapter, chapterIndex) => {
        return `
          <section class="chapter-section anim-section section-${chapter.id} chapter-variant-${chapterIndex % 4}" id="chapter-${chapter.number}" data-chapter-anchor="${chapterIndex}" data-animation-section="${chapter.id}">
            <div class="chapter-intro-scene scroll-scene scroll-scene--chapter" data-scroll-scene="header-${chapter.id}" data-view-type="intro" data-chapter-index="${chapterIndex}">
              <div class="chapter-intro scroll-scene__content reveal-item anim-section-header section-header-${chapter.id}">
                <div class="chapter-intro__meta anim-section-meta">
                  <span class="chapter-kicker anim-eyebrow">${pad(chapter.number)} · ${escapeHtml(chapter.eyebrow || chapter.title)}</span>
                  <h2 class="anim-title">${escapeHtml(chapter.title)}</h2>
                  <p class="anim-copy">${escapeHtml(chapter.speaker)} · ${chapter.slides.length} bloques</p>
                </div>
                <div class="chapter-intro__accent anim-orb"></div>
              </div>
            </div>
            <div class="chapter-flow anim-flow">
              ${chapter.slides.map((slide, slideIndex) => {
                const currentFlatIndex = flatIndex;
                const variant = ['layout-left', 'layout-right', 'layout-center', 'layout-wide', 'layout-floating'][currentFlatIndex % 5];
                const mediaPlacement = getFloatingPlacement(slide);
                const mediaSide = getFloatingSide(variant, currentFlatIndex);
                const sideMedia = mediaPlacement === 'side'
                  ? createFloatingMedia(slide.floatingMedia, slide.floatingLayout || 'single-wide', 'side')
                  : '';
                const dedicatedMediaScene = createPhotoShowcase(slide, chapter, chapterIndex, slideIndex);
                const shellClasses = mediaPlacement === 'side'
                  ? `has-side-media media-side-${mediaSide}`
                  : 'has-no-side-media';

                const html = `
                  <article class="story-block scroll-scene anim-block scene-${chapter.id}-${pad(slideIndex + 1)} scene-layout-${slide.layout || 'generic'} ${variant} ${slide.layout || 'layout-generic'} ${mediaPlacement === 'side' ? 'scene-has-side-media' : ''}" data-flat-index="${currentFlatIndex}" data-chapter-index="${chapterIndex}" data-slide-index="${slideIndex}" data-view-type="slide" data-animation-scene="${chapter.id}-${pad(slideIndex + 1)}" data-scroll-scene="${chapter.id}-${pad(slideIndex + 1)}">
                    <div class="block-shell scroll-scene__content anim-content ${shellClasses}">
                      <div class="block-main">
                        <div class="block-meta reveal-item anim-meta">
                          <span>${pad(chapter.number)}.${pad(slideIndex + 1)}</span>
                          <small>${escapeHtml(slide.eyebrow || chapter.title)}</small>
                        </div>
                        ${renderBlockContent(slide, chapter, currentFlatIndex)}
                      </div>
                      ${sideMedia}
                    </div>
                  </article>
                  ${dedicatedMediaScene}`;
                flatIndex += 1;
                return html;
              }).join('')}
            </div>
          </section>`;
      }).join('')}
    `;

    blocks.splice(0, blocks.length, ...els.scrollRoot.querySelectorAll('.story-block'));
    buildNavigationScenes();
    hydrateMediaSlots(els.scrollRoot);
    initScrollScrub();
  }

  function buildNavigationScenes() {
    navigationScenes.splice(0, navigationScenes.length);
    chapterIntroIndices.splice(0, chapterIntroIndices.length);

    els.scrollRoot.querySelectorAll('.scroll-scene').forEach((element, navIndex) => {
      const viewType = element.dataset.viewType || 'slide';
      const chapterIndex = viewType === 'cover' ? 0 : Number(element.dataset.chapterIndex);
      const slideIndex = ['slide', 'media'].includes(viewType) ? Number(element.dataset.slideIndex) : 0;
      const mediaGroupIndex = viewType === 'media' ? Number(element.dataset.mediaGroupIndex) || 0 : 0;
      const mediaGroupCount = viewType === 'media' ? Math.max(1, Number(element.dataset.mediaGroupCount) || 1) : 1;
      const record = { element, navIndex, viewType, chapterIndex, slideIndex, mediaGroupIndex, mediaGroupCount };

      element.dataset.navIndex = String(navIndex);
      navigationScenes.push(record);

      if (viewType === 'intro' && Number.isInteger(chapterIndex)) {
        chapterIntroIndices[chapterIndex] = navIndex;
      }
    });
  }

  function updateChrome() {
    if (state.viewType === 'cover') {
      els.chapterCounter.textContent = `00 / ${pad(data.chapters.length)}`;
      els.chapterTitle.textContent = data.meta.title;
      els.speaker.textContent = data.meta.organization;
      els.slideCounter.textContent = 'PORTADA';
    } else {
      const chapter = currentChapter();
      els.chapterCounter.textContent = `${pad(chapter.number)} / ${pad(data.chapters.length)}`;
      els.chapterTitle.textContent = chapter.title;
      els.speaker.textContent = chapter.speaker;

      if (state.viewType === 'intro') {
        els.slideCounter.textContent = 'INTRO';
      } else if (state.viewType === 'media') {
        els.slideCounter.textContent = state.mediaGroupCount > 1
          ? `FOTOS · ${state.mediaGroupIndex + 1}/${state.mediaGroupCount}`
          : `FOTOS · ${pad(state.slideIndex + 1)}`;
      } else {
        els.slideCounter.textContent = `${pad(state.slideIndex + 1)} / ${pad(chapter.slides.length)}`;
      }
    }

  }

  function persistState() {
    localStorage.setItem('cedrus-presentation-position', JSON.stringify({
      chapterIndex: state.chapterIndex,
      slideIndex: state.slideIndex,
      viewType: state.viewType,
      mediaGroupIndex: state.mediaGroupIndex,
      mediaGroupCount: state.mediaGroupCount,
      navigationIndex: activeNavigationIndex,
      navigationCursorIndex
    }));
  }

  function publicState() {
    return {
      type: 'state',
      chapterIndex: state.chapterIndex,
      slideIndex: state.slideIndex,
      viewType: state.viewType,
      mediaGroupIndex: state.mediaGroupIndex,
      mediaGroupCount: state.mediaGroupCount,
      navigationIndex: activeNavigationIndex,
      started: state.started,
      blackout: state.blackout,
      timerRemaining: state.timerRemaining,
      timerRunning: state.timerRunning,
      timestamp: Date.now()
    };
  }

  function broadcastState() {
    const payload = publicState();
    channel?.postMessage(payload);
    localStorage.setItem('cedrus-state', JSON.stringify(payload));
  }

  function setActiveScene(record) {
    if (!record?.element) return;
    const { element, navIndex, viewType, chapterIndex, slideIndex, mediaGroupIndex = 0, mediaGroupCount = 1 } = record;
    const alreadyCurrent = element.classList.contains('is-current');
    const sameView = activeNavigationIndex === navIndex && state.viewType === viewType;
    if (alreadyCurrent && sameView) return;

    activeNavigationIndex = navIndex;
    if (!cinematicScroll?.isNavigating) navigationCursorIndex = navIndex;
    document.querySelectorAll('.scroll-scene.is-current').forEach(item => item.classList.remove('is-current'));
    element.classList.add('is-current');

    state.viewType = viewType;
    state.mediaGroupIndex = viewType === 'media' ? mediaGroupIndex : 0;
    state.mediaGroupCount = viewType === 'media' ? mediaGroupCount : 1;
    if (viewType !== 'cover') {
      state.chapterIndex = Math.max(0, Math.min(data.chapters.length - 1, chapterIndex));
      state.slideIndex = ['slide', 'media'].includes(viewType)
        ? Math.max(0, Math.min(currentChapter().slides.length - 1, slideIndex))
        : 0;
    } else {
      state.chapterIndex = 0;
      state.slideIndex = 0;
    }

    if (viewType === 'slide') activeFlatIndex = Number(element.dataset.flatIndex) || 0;

    updateTheme(state.chapterIndex);
    updateChrome();
    persistState();
    broadcastState();
  }

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function smootherstep(edge0, edge1, value) {
    const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function mix(from, to, amount) {
    return from + (to - from) * amount;
  }

  function getMotionValues(style, enter, exit, isItem = false) {
    const distanceFactor = isItem ? 0.42 : 1;
    const horizontal = motionConfig.horizontalDistancePx * distanceFactor;
    const vertical = motionConfig.verticalDistancePx * distanceFactor;
    const subtleScale = isItem ? 0.985 : 0.96;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let startScale = subtleScale;
    let endScale = isItem ? 0.985 : 0.97;

    switch (style) {
      case 'top-down':
        startY = -vertical;
        endY = vertical;
        break;
      case 'left-right':
        startX = -horizontal;
        endX = horizontal;
        break;
      case 'right-left':
        startX = horizontal;
        endX = -horizontal;
        break;
      case 'center-out':
        startScale = isItem ? 0.9 : motionConfig.centerOutStartScale;
        endScale = isItem ? 1.08 : motionConfig.centerOutExitScale;
        break;
      case 'center-in':
        startScale = isItem ? 1.08 : motionConfig.centerInStartScale;
        endScale = isItem ? 0.9 : motionConfig.centerInExitScale;
        break;
      default:
        startY = vertical;
        endY = -vertical;
    }

    const enteringX = mix(startX, 0, enter);
    const enteringY = mix(startY, 0, enter);
    const enteringScale = mix(startScale, 1, enter);

    return {
      x: mix(enteringX, endX, exit),
      y: mix(enteringY, endY, exit),
      scale: mix(enteringScale, endScale, exit)
    };
  }

  function prepareScrubScene(scene) {
    const content = scene.querySelector(':scope > .scroll-scene__content');
    if (!content) return null;

    const navIndex = Number(scene.dataset.navIndex);
    const navigationRecord = navigationScenes[navIndex] || null;
    const style = scene.dataset.scrollStyle || styleSequence[navIndex % styleSequence.length];

    scene.dataset.scrollStyle = style;
    scene.classList.add(`scroll-motion-${style}`);

    const items = [...content.querySelectorAll('.reveal-item')]
      .filter(item => item !== content);

    items.forEach((item, index) => {
      item.style.setProperty('--scrub-index', String(index));
      item.dataset.scrubIndex = String(index);
    });

    return {
      scene,
      content,
      items,
      style,
      navigationRecord,
      visualProgress: null
    };
  }

  function updateScrollScrub({ dt = 1 / 60, force = false } = {}) {
    const viewportHeight = Math.max(1, window.innerHeight);
    const response = Math.max(0.1, transitionConfig.visualResponse);
    const follow = force ? 1 : 1 - Math.exp(-response * Math.min(0.05, Math.max(1 / 240, dt)));
    let bestRecord = null;
    let bestScore = -Infinity;
    let maxVisualDelta = 0;

    scrubScenes.forEach(record => {
      const { scene, content, items, style, navigationRecord } = record;
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(1, rect.height + viewportHeight * 0.82);
      const rawProgress = clamp((viewportHeight * 0.94 - rect.top) / travel);

      if (record.visualProgress === null || force) record.visualProgress = rawProgress;
      const before = record.visualProgress;
      record.visualProgress += (rawProgress - record.visualProgress) * follow;
      if (Math.abs(rawProgress - record.visualProgress) < 0.00005) record.visualProgress = rawProgress;
      maxVisualDelta = Math.max(maxVisualDelta, Math.abs(record.visualProgress - before), Math.abs(rawProgress - record.visualProgress));

      const progress = clamp(record.visualProgress);
      const enter = smootherstep(transitionConfig.enterStart, transitionConfig.enterEnd, progress);
      const exit = smootherstep(transitionConfig.exitStart, transitionConfig.exitEnd, progress);
      const visibility = clamp(enter * (1 - exit));
      const motion = getMotionValues(style, enter, exit, false);
      const blur = (1 - visibility) * motionConfig.sceneBlurPx;

      scene.style.setProperty('--scene-progress', progress.toFixed(5));
      scene.style.setProperty('--scene-raw-progress', rawProgress.toFixed(5));
      content.style.setProperty('--scene-opacity', visibility.toFixed(5));
      content.style.setProperty('--scene-x', `${motion.x.toFixed(2)}px`);
      content.style.setProperty('--scene-y', `${motion.y.toFixed(2)}px`);
      content.style.setProperty('--scene-scale', motion.scale.toFixed(5));
      content.style.setProperty('--scene-blur', `${blur.toFixed(2)}px`);

      scene.classList.toggle('is-scrub-visible', visibility > transitionConfig.visibilityThreshold);
      scene.classList.toggle('is-scrub-focused', visibility > transitionConfig.focusThreshold);

      const count = Math.max(1, items.length);
      items.forEach((item, index) => {
        const stagger = Math.min(0.09, index * transitionConfig.itemStagger);
        const itemEnter = smootherstep(
          transitionConfig.itemEnterStart + stagger,
          transitionConfig.itemEnterEnd + stagger,
          progress
        );
        const reverseIndex = count - index - 1;
        const exitOffset = Math.min(0.04, reverseIndex * 0.005);
        const itemExit = smootherstep(
          transitionConfig.itemExitStart + exitOffset,
          transitionConfig.itemExitEnd + Math.min(0.018, reverseIndex * 0.003),
          progress
        );
        const itemOpacity = clamp(itemEnter * (1 - itemExit));
        const itemMotion = getMotionValues(style, itemEnter, itemExit, true);
        const itemBlur = (1 - itemOpacity) * motionConfig.itemBlurPx;

        item.style.setProperty('--item-opacity', itemOpacity.toFixed(5));
        item.style.setProperty('--item-x', `${itemMotion.x.toFixed(2)}px`);
        item.style.setProperty('--item-y', `${itemMotion.y.toFixed(2)}px`);
        item.style.setProperty('--item-scale', itemMotion.scale.toFixed(5));
        item.style.setProperty('--item-blur', `${itemBlur.toFixed(2)}px`);
      });

      const focusAffinity = 1 - clamp(Math.abs(progress - 0.5) / 0.5);
      const score = visibility * 1.55 + focusAffinity * 0.38;
      if (navigationRecord && score > bestScore) {
        bestScore = score;
        bestRecord = navigationRecord;
      }
    });

    if (bestRecord && bestScore > 0.16) setActiveScene(bestRecord);
    return maxVisualDelta > 0.00035;
  }

  function scheduleScrollScrub() {
    if (cinematicScroll) {
      cinematicScroll.requestFrame();
      return;
    }
    if (fallbackScrubFrame !== null) return;
    const frame = now => {
      fallbackScrubFrame = null;
      const needsMore = updateScrollScrub({ dt: 1 / 60 });
      if (needsMore) fallbackScrubFrame = requestAnimationFrame(frame);
    };
    fallbackScrubFrame = requestAnimationFrame(frame);
  }

  function applyTransitionConfig() {
    const root = document.documentElement;
    root.style.setProperty('--scrub-scene-height', `${transitionConfig.sceneScrollHeightVh}vh`);
    root.style.setProperty('--scrub-chapter-height', `${transitionConfig.chapterIntroScrollHeightVh}vh`);
    root.style.setProperty('--scrub-cover-height', `${transitionConfig.coverScrollHeightVh}vh`);
    root.style.setProperty('--scrub-scene-height-mobile', `${transitionConfig.mobileSceneScrollHeightVh}vh`);
    root.style.setProperty('--scrub-chapter-height-mobile', `${transitionConfig.mobileChapterIntroScrollHeightVh}vh`);
    root.style.setProperty('--scrub-cover-height-mobile', `${transitionConfig.mobileCoverScrollHeightVh}vh`);
  }

  function initCinematicScroll() {
    if (typeof window.CedrusCinematicScroll !== 'function') {
      window.addEventListener('scroll', scheduleScrollScrub, { passive: true });
      updateScrollScrub({ force: true });
      return;
    }

    cinematicScroll = new window.CedrusCinematicScroll({
      ...smoothScrollConfig,
      preventSelector: '[data-native-scroll], input, textarea, select, option',
      onStep: direction => direction > 0 ? goNext() : goPrev(),
      onUpdate: frame => updateScrollScrub(frame)
    });
    cinematicScroll.requestFrame();
  }

  function initScrollScrub() {
    document.documentElement.classList.add('scroll-scrub-enabled');
    applyTransitionConfig();
    scrubScenes.splice(0, scrubScenes.length);

    els.scrollRoot.querySelectorAll('.scroll-scene').forEach(scene => {
      const prepared = prepareScrubScene(scene);
      if (prepared) scrubScenes.push(prepared);
    });

    window.addEventListener('resize', () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        updateScrollScrub({ force: true });
        cinematicScroll?.syncToWindow();
      });
    }, { passive: true });

    updateScrollScrub({ force: true });
    initCinematicScroll();
  }

  function easeInOutSine(value) {
    return -(Math.cos(Math.PI * value) - 1) / 2;
  }

  let fallbackNavigationFrame = null;

  function cancelProgrammaticScroll() {
    cinematicScroll?.cancelNavigation();
    if (fallbackNavigationFrame !== null) cancelAnimationFrame(fallbackNavigationFrame);
    fallbackNavigationFrame = null;
  }

  function animateWindowScroll(targetY, durationMs = smoothScrollConfig.navigationDurationMs) {
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const destination = clamp(targetY, 0, maxY);

    if (cinematicScroll) {
      cinematicScroll.scrollTo(destination, { durationMs });
      return;
    }

    cancelProgrammaticScroll();
    const startY = window.scrollY;
    const distance = destination - startY;
    if (Math.abs(distance) < 2 || durationMs <= 0) {
      window.scrollTo(0, destination);
      updateScrollScrub({ force: true });
      return;
    }

    const startTime = performance.now();
    const frame = now => {
      const progress = clamp((now - startTime) / durationMs);
      window.scrollTo(0, startY + distance * easeInOutSine(progress));
      updateScrollScrub({ dt: 1 / 60 });
      if (progress < 1) fallbackNavigationFrame = requestAnimationFrame(frame);
      else fallbackNavigationFrame = null;
    };
    fallbackNavigationFrame = requestAnimationFrame(frame);
  }

  function getSceneFocusScrollY(element) {
    const viewportHeight = Math.max(1, window.innerHeight);
    const rect = element.getBoundingClientRect();
    const targetProgress = 0.5;
    const targetRectTop = viewportHeight * 0.94 - targetProgress * (rect.height + viewportHeight * 0.82);
    return window.scrollY + rect.top - targetRectTop;
  }

  function isTransitionInProgress() {
    return Boolean(cinematicScroll?.isNavigating || fallbackNavigationFrame !== null);
  }

  function scrollToNavigationIndex(index, durationMs = standardTransitionDurationMs) {
    const isImmediate = durationMs <= 0;
    if (!isImmediate && timingConfig.lockInputDuringTransition && isTransitionInProgress()) return false;

    const clampedIndex = Math.max(0, Math.min(navigationScenes.length - 1, index));
    const record = navigationScenes[clampedIndex];
    if (!record?.element) return false;
    if (!isImmediate && clampedIndex === navigationCursorIndex) return false;

    navigationCursorIndex = clampedIndex;
    if (isImmediate) setActiveScene(record);
    animateWindowScroll(getSceneFocusScrollY(record.element), isImmediate ? 0 : standardTransitionDurationMs);
    return true;
  }

  function scrollToPosition(chapterIndex, slideIndex) {
    const record = navigationScenes.find(item =>
      item.viewType === 'slide' &&
      item.chapterIndex === chapterIndex &&
      item.slideIndex === slideIndex
    );
    if (record) scrollToNavigationIndex(record.navIndex);
  }

  function goNext() {
    return scrollToNavigationIndex(navigationCursorIndex + 1);
  }

  function goPrev() {
    return scrollToNavigationIndex(navigationCursorIndex - 1);
  }

  function goChapter(chapterIndex) {
    if (!Number.isInteger(chapterIndex) || chapterIndex < 0 || chapterIndex >= data.chapters.length) return;
    const navigationIndex = chapterIntroIndices[chapterIndex];
    if (Number.isInteger(navigationIndex)) scrollToNavigationIndex(navigationIndex);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  function toggleBlackout(force) {
    state.blackout = typeof force === 'boolean' ? force : !state.blackout;
    els.blackout.classList.toggle('is-active', state.blackout);
    els.blackout.setAttribute('aria-hidden', String(!state.blackout));
    broadcastState();
  }

  function toggleHelp() {
    const active = !els.help.classList.contains('is-active');
    els.help.classList.toggle('is-active', active);
    els.help.setAttribute('aria-hidden', String(!active));
  }

  function openPresenter() {
    window.open('presenter.html', 'cedrusPresenter', 'width=1380,height=900,resizable=yes,scrollbars=yes');
    window.setTimeout(broadcastState, 300);
  }

  function handleRemote(message) {
    if (!message || typeof message !== 'object') return;
    if (isDuplicateCommand(message)) return;
    if (message.type === 'requestState') return broadcastState();
    if (message.type === 'timer') {
      state.timerRemaining = Math.max(0, Number(message.remaining) || 0);
      state.timerRunning = Boolean(message.running);
      updateChrome();
      return;
    }
    if (message.type !== 'command') return;

    switch (message.action) {
      case 'nextSlide': goNext(); break;
      case 'prevSlide': goPrev(); break;
      case 'nextChapter': goChapter(Math.min(data.chapters.length - 1, state.chapterIndex + 1)); break;
      case 'prevChapter': goChapter(Math.max(0, state.chapterIndex - 1)); break;
      case 'goStart': goChapter(0); break;
      case 'blackout': toggleBlackout(); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'goTo':
        if (Number.isInteger(message.chapterIndex) && Number.isInteger(message.slideIndex)) {
          scrollToPosition(message.chapterIndex, message.slideIndex);
        }
        break;
    }
  }

  function initAmbientCanvas() {
    const canvas = els.canvas;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];

    function createParticles() {
      const count = Math.max(90, Math.floor(window.innerWidth / 11));
      particles = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z: depth,
          size: 0.5 + depth * 2.4,
          alpha: 0.08 + depth * 0.22,
          speedX: (Math.random() - 0.5) * (0.12 + depth * 0.3),
          speedY: (Math.random() - 0.5) * (0.08 + depth * 0.22),
          twinkle: Math.random() * Math.PI * 2
        };
      });
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    }

    function frame() {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '82,165,54';
      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * 0.5, height * 0.2, 0, width * 0.5, height * 0.2, Math.max(width, height) * 0.75);
      glow.addColorStop(0, `rgba(${accent}, 0.11)`);
      glow.addColorStop(0.4, `rgba(${accent}, 0.03)`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.twinkle += 0.015 + p.z * 0.02;

        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        const a = p.alpha + Math.sin(p.twinkle) * 0.04;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0.02, a)})`;
        ctx.fill();

        if (index % 10 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accent},${0.008 + p.z * 0.02})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener('resize', resize);
  }

  function initCursorGlow() {
    document.addEventListener('pointermove', event => {
      els.cursorGlow.style.transform = `translate(${event.clientX - 180}px, ${event.clientY - 180}px)`;
    });
  }

  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem('cedrus-presentation-position') || 'null');
      if (!saved) return;

      requestAnimationFrame(() => {
        if (Number.isInteger(saved.navigationIndex)) {
          scrollToNavigationIndex(saved.navigationIndex, 0);
          return;
        }

        if (saved.viewType === 'intro' && Number.isInteger(saved.chapterIndex)) {
          goChapter(saved.chapterIndex);
          return;
        }

        if (Number.isInteger(saved.chapterIndex) && Number.isInteger(saved.slideIndex)) {
          scrollToPosition(saved.chapterIndex, saved.slideIndex);
        }
      });
    } catch (_) {}
  }


  window.addEventListener('touchstart', cancelProgrammaticScroll, { passive: true });
  window.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') cancelProgrammaticScroll();
  }, { passive: true });

  els.presenter.addEventListener('click', openPresenter);
  els.fullscreen.addEventListener('click', toggleFullscreen);

  window.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const key = event.key.toLowerCase();
    if (state.blackout && key !== 'b' && key !== 'escape') return;
    if (['arrowdown', 'arrowright', 'pagedown', ' '].includes(key)) { event.preventDefault(); goNext(); }
    else if (['arrowup', 'arrowleft', 'pageup'].includes(key)) { event.preventDefault(); goPrev(); }
    else if (key === 'home') { event.preventDefault(); goChapter(0); }
    else if (key === 'end') { event.preventDefault(); goChapter(data.chapters.length - 1); }
    else if (key === 'p') openPresenter();
    else if (key === 'f') toggleFullscreen();
    else if (key === 'b') toggleBlackout();
    else if (key === 'h' || key === '?') toggleHelp();
    else if (key === 'escape') {
      if (state.blackout) toggleBlackout(false);
    }
  });

  window.addEventListener('storage', event => {
    if (event.key === 'cedrus-command' && event.newValue) {
      try { handleRemote(JSON.parse(event.newValue)); } catch (_) {}
    }
    if (event.key === 'cedrus-timer' && event.newValue) {
      try { handleRemote(JSON.parse(event.newValue)); } catch (_) {}
    }
  });

  channel?.addEventListener('message', event => handleRemote(event.data));

  renderStory();
  updateTheme(0);
  updateChrome();
  initAmbientCanvas();
  initCursorGlow();
  restoreState();
  channel?.postMessage({ type: 'requestState', timestamp: Date.now() });
  localStorage.setItem('cedrus-command', JSON.stringify({ type: 'requestState', timestamp: Date.now() }));
})();
