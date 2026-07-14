/* ========================================================================
   CONFIGURACIÓN DE LA EXPERIENCIA CINEMATOGRÁFICA
   ========================================================================

   Esta versión utiliza dos capas de suavizado:

   1) MOVIMIENTO DE LA PÁGINA
      El motor cinematic-scroll.js suaviza rueda, trackpad y navegación por teclado.

   2) APARICIÓN DE ELEMENTOS
      app.js interpola gradualmente el progreso visual de cada escena.

   Los valores incluidos están calibrados para una transición inmersiva, constante
   y sin cambios agresivos. Edita únicamente este archivo para ajustar el ritmo.
   ======================================================================== */

window.CEDRUS_PRESENTATION_CONFIG = {
  smoothScroll: {
    enabled: true,

    // Sensibilidad de la rueda o trackpad. Menor = recorrido más calmado.
    wheelMultiplier: 0.56,

    // Limita saltos grandes provocados por ciertas ruedas de mouse.
    wheelMaxStepPx: 230,

    // Qué tan rápido el movimiento alcanza el punto solicitado por el scroll.
    // 5.5 = muy flotante, 6.6 = recomendado, 8 = más directo.
    response: 6.4,

    // Velocidad máxima del movimiento generado por rueda o trackpad.
    maxSpeedPxPerSecond: 1550,

    // Duración al avanzar con flechas, espacio o control del presentador.
    navigationDurationMs: 2450,

    // "sine" es más continuo y elegante. "quint" es más cinematográfico.
    navigationEase: 'sine',

    stopThresholdPx: 0.10
  },

  transition: {
    // Distancia disponible para que cada escena aparezca, permanezca y salga.
    sceneScrollHeightVh: 188,
    chapterIntroScrollHeightVh: 160,
    coverScrollHeightVh: 196,

    mobileSceneScrollHeightVh: 150,
    mobileChapterIntroScrollHeightVh: 132,
    mobileCoverScrollHeightVh: 164,

    // Entrada prolongada, zona central estable y salida progresiva.
    enterStart: 0.015,
    enterEnd: 0.34,
    exitStart: 0.66,
    exitEnd: 0.985,

    // Aparición escalonada de títulos, textos y tarjetas.
    itemEnterStart: 0.045,
    itemEnterEnd: 0.33,
    itemExitStart: 0.69,
    itemExitEnd: 0.975,
    itemStagger: 0.012,

    // Respuesta visual independiente del movimiento físico de la página.
    // Menor = mayor flotación; mayor = sigue el scroll con más rapidez.
    visualResponse: 7.2,

    visibilityThreshold: 0.025,
    focusThreshold: 0.68
  },

  motion: {
    // Distancias moderadas para evitar entradas agresivas.
    horizontalDistancePx: 82,
    verticalDistancePx: 62,
    sceneBlurPx: 10,
    itemBlurPx: 5,

    centerOutStartScale: 0.90,
    centerOutExitScale: 1.065,
    centerInStartScale: 1.065,
    centerInExitScale: 0.92
  },

  styleSequence: [
    'top-down',
    'left-right',
    'right-left',
    'center-out',
    'center-in'
  ]
};
