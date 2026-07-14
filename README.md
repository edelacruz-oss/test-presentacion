# Cedrus Immersive Presentation — Laptop Standard Edition

Esta versión conserva el diseño y la experiencia **Cinematic Flow**, pero estandariza el ritmo de las transiciones para que se vea fluido en una laptop, aunque cambie la resolución, el tamaño del monitor o el dispositivo de salida.

## Qué cambió

- Scroll, teclado y controles del presentador utilizan el mismo tiempo de transición.
- Cada gesto de scroll avanza o retrocede exactamente una escena.
- La duración ya no depende de la cantidad de píxeles que envíe la rueda o el trackpad.
- La navegación se bloquea temporalmente durante la animación para impedir saltos o aceleraciones.
- La inercia del trackpad no puede disparar dos escenas consecutivas.
- Portada, introducciones de sección y momentos de contenido usan una altura visual uniforme.
- Se conservaron las entradas desde arriba, izquierda, derecha y centro.
- Se mantiene la corrección de los controles del presentador para avanzar de uno en uno.

## Tiempo estándar aplicado

Todas las transiciones duran:

```text
2400 ms · 2.4 segundos
```

Este valor está pensado para laptops de uso común y presentaciones en pantalla completa.

## Cambiar la velocidad

Abre `configuracion.js` y modifica únicamente:

```js
standardTransitionDurationMs: 2400
```

Valores útiles:

- `2000`: fluido y un poco más ágil.
- `2400`: equilibrio recomendado.
- `2800`: más lento y cinematográfico.

## Controles

- Scroll hacia abajo: siguiente escena.
- Scroll hacia arriba: escena anterior.
- Flechas `↑`, `↓`, `←`, `→`: anterior o siguiente.
- Espacio: avanzar.
- `P`: pantalla del presentador.
- `F`: pantalla completa.
- `B`: pantalla negra.
- `H`: ayuda.

## Inicio

Ejecuta `INICIAR_PRESENTACION.bat` o abre `index.html`.
