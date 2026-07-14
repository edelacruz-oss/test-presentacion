(() => {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeInOutSine = value => -(Math.cos(Math.PI * value) - 1) / 2;
  const easeInOutQuint = value => value < 0.5
    ? 16 * value * value * value * value * value
    : 1 - Math.pow(-2 * value + 2, 5) / 2;

  class CedrusCinematicScroll {
    constructor(options = {}) {
      this.options = {
        enabled: true,
        wheelMode: 'free',
        wheelStepThresholdPx: 46,
        wheelGestureCooldownMs: 360,
        wheelMultiplier: 0.58,
        wheelMaxStepPx: 260,
        response: 6.6,
        maxSpeedPxPerSecond: 1800,
        stopThresholdPx: 0.12,
        navigationDurationMs: 2300,
        navigationEase: 'sine',
        preventSelector: '[data-native-scroll], input, textarea, select, option',
        onStep: null,
        onUpdate: null,
        ...options
      };

      this.enabled = this.options.enabled !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.current = window.scrollY || 0;
      this.target = this.current;
      this.lastApplied = this.current;
      this.lastTime = performance.now();
      this.frame = null;
      this.navigation = null;
      this.isApplying = false;
      this.destroyed = false;
      this.wheelAccumulator = 0;
      this.wheelResetTimer = null;
      this.wheelLockUntil = 0;

      this.handleWheel = this.handleWheel.bind(this);
      this.handleNativeScroll = this.handleNativeScroll.bind(this);
      this.handleResize = this.handleResize.bind(this);
      this.tick = this.tick.bind(this);

      if (this.enabled) document.documentElement.classList.add('cinematic-scroll-active');
      window.addEventListener('wheel', this.handleWheel, { passive: false });
      window.addEventListener('scroll', this.handleNativeScroll, { passive: true });
      window.addEventListener('resize', this.handleResize, { passive: true });
    }

    get maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    get isNavigating() {
      return Boolean(this.navigation);
    }

    normalizeWheel(event) {
      const modeMultiplier = event.deltaMode === 1
        ? 18
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
      return event.deltaY * modeMultiplier;
    }

    shouldPreserveNativeScroll(target) {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest(this.options.preventSelector));
    }

    handleWheel(event) {
      if (!this.enabled || this.destroyed || this.shouldPreserveNativeScroll(event.target)) return;
      if (Math.abs(event.deltaY) < 0.01) return;

      event.preventDefault();
      const normalizedDelta = this.normalizeWheel(event);

      if (this.options.wheelMode === 'scene' && typeof this.options.onStep === 'function') {
        const now = performance.now();
        const direction = Math.sign(normalizedDelta);
        if (!direction) return;

        if (this.isNavigating || now < this.wheelLockUntil) {
          this.resetWheelAccumulatorSoon();
          return;
        }

        if (this.wheelAccumulator && Math.sign(this.wheelAccumulator) !== direction) {
          this.wheelAccumulator = 0;
        }

        this.wheelAccumulator += normalizedDelta;
        this.resetWheelAccumulatorSoon();

        if (Math.abs(this.wheelAccumulator) >= Math.max(1, this.options.wheelStepThresholdPx)) {
          this.wheelAccumulator = 0;
          const accepted = this.options.onStep(direction) !== false;
          if (accepted) {
            this.wheelLockUntil = now + this.options.navigationDurationMs + this.options.wheelGestureCooldownMs;
          }
        }
        return;
      }

      this.cancelNavigation();
      const rawDelta = normalizedDelta * this.options.wheelMultiplier;
      const delta = clamp(rawDelta, -this.options.wheelMaxStepPx, this.options.wheelMaxStepPx);
      this.target = clamp(this.target + delta, 0, this.maxScroll);
      this.requestFrame();
    }

    resetWheelAccumulatorSoon() {
      if (this.wheelResetTimer !== null) clearTimeout(this.wheelResetTimer);
      this.wheelResetTimer = window.setTimeout(() => {
        this.wheelAccumulator = 0;
        this.wheelResetTimer = null;
      }, 180);
    }

    handleNativeScroll() {
      const actual = window.scrollY || 0;
      if (this.isApplying || Math.abs(actual - this.lastApplied) < 1.5) return;

      this.cancelNavigation();
      this.current = actual;
      this.target = actual;
      this.lastApplied = actual;
      this.requestFrame();
    }

    handleResize() {
      this.current = clamp(this.current, 0, this.maxScroll);
      this.target = clamp(this.target, 0, this.maxScroll);
      this.requestFrame();
    }

    requestFrame() {
      if (this.frame !== null || this.destroyed) return;
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    applyScroll(value) {
      const next = clamp(value, 0, this.maxScroll);
      this.current = next;
      this.lastApplied = next;
      this.isApplying = true;
      window.scrollTo(0, next);
      requestAnimationFrame(() => { this.isApplying = false; });
    }

    easing(value) {
      if (this.options.navigationEase === 'quint') return easeInOutQuint(value);
      return easeInOutSine(value);
    }

    tick(now) {
      this.frame = null;
      const dt = clamp((now - this.lastTime) / 1000, 1 / 240, 1 / 20);
      this.lastTime = now;

      if (this.navigation) {
        const elapsed = now - this.navigation.startTime;
        const progress = clamp(elapsed / this.navigation.durationMs, 0, 1);
        const eased = this.easing(progress);
        const next = this.navigation.startY + (this.navigation.endY - this.navigation.startY) * eased;
        this.target = next;
        this.applyScroll(next);

        if (progress >= 1) {
          const complete = this.navigation.onComplete;
          this.navigation = null;
          this.current = this.target = clamp(next, 0, this.maxScroll);
          if (typeof complete === 'function') complete();
        }
      } else if (this.enabled) {
        const difference = this.target - this.current;
        const response = Math.max(0.01, this.options.response);
        const alpha = 1 - Math.exp(-response * dt);
        let step = difference * alpha;
        const maxStep = this.options.maxSpeedPxPerSecond * dt;
        step = clamp(step, -maxStep, maxStep);

        if (Math.abs(difference) <= this.options.stopThresholdPx) {
          this.applyScroll(this.target);
        } else {
          this.applyScroll(this.current + step);
        }
      }

      const needsVisualFrames = typeof this.options.onUpdate === 'function'
        ? Boolean(this.options.onUpdate({ dt, scroll: this.current, target: this.target, navigating: this.isNavigating }))
        : false;

      const stillMoving = this.navigation || Math.abs(this.target - this.current) > this.options.stopThresholdPx;
      if (stillMoving || needsVisualFrames) this.requestFrame();
    }

    scrollTo(targetY, options = {}) {
      const endY = clamp(Number(targetY) || 0, 0, this.maxScroll);
      const durationMs = Math.max(0, Number(options.durationMs ?? this.options.navigationDurationMs));
      const immediate = options.immediate === true || durationMs === 0 || !this.enabled;

      this.cancelNavigation();

      if (immediate) {
        this.current = this.target = endY;
        this.applyScroll(endY);
        if (typeof options.onComplete === 'function') options.onComplete();
        if (typeof this.options.onUpdate === 'function') this.options.onUpdate({ dt: 1 / 60, scroll: this.current, target: this.target, navigating: false, force: true });
        return;
      }

      this.navigation = {
        startY: this.current,
        endY,
        startTime: performance.now(),
        durationMs,
        onComplete: options.onComplete
      };
      this.target = endY;
      this.requestFrame();
    }

    cancelNavigation() {
      if (!this.navigation) return;
      this.navigation = null;
      this.target = this.current;
    }

    syncToWindow() {
      const y = window.scrollY || 0;
      this.current = this.target = this.lastApplied = y;
      this.requestFrame();
    }

    destroy() {
      this.destroyed = true;
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      if (this.wheelResetTimer !== null) clearTimeout(this.wheelResetTimer);
      window.removeEventListener('wheel', this.handleWheel);
      window.removeEventListener('scroll', this.handleNativeScroll);
      window.removeEventListener('resize', this.handleResize);
      document.documentElement.classList.remove('cinematic-scroll-active');
    }
  }

  window.CedrusCinematicScroll = CedrusCinematicScroll;
})();
