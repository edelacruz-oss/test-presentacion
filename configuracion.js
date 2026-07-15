/* ========================================================================
   CONFIGURACIÓN ESTÁNDAR PARA LAPTOP · CEDRUS CINEMATIC FLOW
   ========================================================================

   Esta versión ya no calcula la sensación de velocidad con base en la
   resolución o la altura de la pantalla. La rueda, las flechas del teclado
   y los controles del presentador avanzan siempre una escena mediante una
   transición de duración fija.

   AJUSTE PRINCIPAL:
   - standardTransitionDurationMs controla el tiempo de TODAS las transiciones.
   - 2200 a 2600 ms ofrece una experiencia fluida y cinematográfica.
   ======================================================================== */

window.CEDRUS_PRESENTATION_CONFIG = {
  editing: {
    // false: presentación normal. true: inicia sin animación de desplazamiento.
    quickModeDefault: false,

    // Presiona esta tecla para activar o desactivar temporalmente el modo rápido.
    shortcut: 'e'
  },

  timing: {
    // Tiempo estándar para scroll, teclado y pantalla del presentador.
    standardTransitionDurationMs: 2400,

    // Durante la transición se bloquean nuevas órdenes para evitar saltos.
    lockInputDuringTransition: true
  },

  smoothScroll: {
    enabled: true,

    // La rueda funciona por escenas, no por cantidad de píxeles recorridos.
    // Así el resultado es el mismo en laptop, TV o proyector.
    wheelMode: 'scene',

    // Movimiento mínimo acumulado para interpretar un gesto de scroll.
    wheelStepThresholdPx: 46,

    // Evita que la inercia del trackpad dispare dos escenas seguidas.
    wheelGestureCooldownMs: 360,

    // Estos valores se mantienen para desplazamientos nativos excepcionales.
    wheelMultiplier: 0.50,
    wheelMaxStepPx: 180,
    response: 7.4,
    maxSpeedPxPerSecond: 1320,

    // Se sobrescribe automáticamente con standardTransitionDurationMs.
    navigationDurationMs: 2400,
    navigationEase: 'sine',
    stopThresholdPx: 0.08
  },

  transition: {
    // Todas las escenas tienen la misma altura relativa para que la distancia
    // visual sea constante en pantallas de laptop.
    sceneScrollHeightVh: 168,
    chapterIntroScrollHeightVh: 168,
    coverScrollHeightVh: 168,

    mobileSceneScrollHeightVh: 150,
    mobileChapterIntroScrollHeightVh: 150,
    mobileCoverScrollHeightVh: 150,

    // Entrada amplia, pausa visual y salida progresiva.
    enterStart: 0.02,
    enterEnd: 0.36,
    exitStart: 0.64,
    exitEnd: 0.98,

    // Aparición escalonada de títulos, textos, tarjetas y métricas.
    itemEnterStart: 0.055,
    itemEnterEnd: 0.35,
    itemExitStart: 0.67,
    itemExitEnd: 0.97,
    itemStagger: 0.011,

    // Sigue el movimiento de forma suave sin quedarse rezagado.
    visualResponse: 10.5,

    visibilityThreshold: 0.02,
    focusThreshold: 0.67
  },

  motion: {
    // Distancias moderadas para una transición elegante en laptop.
    horizontalDistancePx: 68,
    verticalDistancePx: 52,
    sceneBlurPx: 8,
    itemBlurPx: 4,

    centerOutStartScale: 0.925,
    centerOutExitScale: 1.045,
    centerInStartScale: 1.045,
    centerInExitScale: 0.94
  },

  styleSequence: [
    'top-down',
    'left-right',
    'right-left',
    'center-out',
    'center-in'
  ]
};
