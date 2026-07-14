# Cedrus Immersive Presentation — Cinematic Flow V3

Esta versión reemplaza la sensación de salto entre escenas por un movimiento continuo, progresivo e inmersivo.

## Qué se corrigió

- La rueda y el trackpad ya no trasladan la página de forma inmediata.
- Las flechas, espacio y controles del presentador usan el mismo ritmo cinematográfico.
- La escena no responde de manera brusca al desplazamiento real: existe una segunda interpolación visual.
- Los títulos, textos, tarjetas, métricas e imágenes aparecen paulatinamente.
- La salida de cada bloque es gradual y se cruza suavemente con la siguiente escena.
- Las introducciones de cada capítulo siguen formando parte de la secuencia de navegación.
- Se conservaron las entradas desde arriba, izquierda, derecha y centro.

## Motor integrado

Se agregó el archivo:

```text
cinematic-scroll.js
```

Este archivo funciona como una pequeña librería interna y controla:

- suavizado de rueda y trackpad;
- velocidad máxima;
- amortiguación del movimiento;
- navegación animada mediante teclado;
- sincronización con la animación de cada escena.

No requiere conexión a internet ni dependencias externas.

## Configuración

Todos los ajustes están en:

```text
configuracion.js
```

La configuración entregada ya está calibrada para una experiencia fluida y no agresiva.

## Controles

- Scroll / trackpad: desplazamiento cinematográfico.
- Flechas `↑`, `↓`, `←`, `→`: escena anterior o siguiente.
- Espacio: avanzar.
- `P`: pantalla del presentador.
- `F`: pantalla completa.
- `B`: pantalla negra.
- `H`: ayuda.

## Inicio

Ejecuta `INICIAR_PRESENTACION.bat` o abre `index.html`.
