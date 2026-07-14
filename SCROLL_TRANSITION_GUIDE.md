# Guía del movimiento cinematográfico

## Arquitectura

La transición utiliza dos capas:

### 1. Movimiento físico

`cinematic-scroll.js` recibe la rueda, el trackpad o la navegación por teclado y genera una trayectoria continua.

### 2. Movimiento visual

`app.js` suaviza nuevamente el progreso de cada escena. Por eso los elementos no reaccionan de golpe aunque el usuario mueva la rueda rápidamente.

## Configuración principal

Edita `configuracion.js`.

### Ritmo de rueda y trackpad

```js
smoothScroll: {
  wheelMultiplier: 0.56,
  response: 6.4,
  maxSpeedPxPerSecond: 1550
}
```

- `wheelMultiplier`: sensibilidad del dispositivo.
- `response`: rapidez con la que el movimiento alcanza el destino.
- `maxSpeedPxPerSecond`: límite para evitar desplazamientos agresivos.

### Flechas y teclado

```js
navigationDurationMs: 2450,
navigationEase: 'sine'
```

La curva `sine` mantiene una aceleración y frenado suaves.

### Duración de una escena

```js
sceneScrollHeightVh: 188,
chapterIntroScrollHeightVh: 160,
coverScrollHeightVh: 196
```

Una altura mayor prolonga la entrada, la permanencia y la salida.

### Aparición y desaparición

```js
enterStart: 0.015,
enterEnd: 0.34,
exitStart: 0.66,
exitEnd: 0.985
```

La escena utiliza aproximadamente:

- 32.5% del recorrido para aparecer;
- 32% para permanecer estable;
- 32.5% para desaparecer.

### Suavizado visual

```js
visualResponse: 7.2
```

- `5.5`: muy flotante.
- `7.2`: inmersivo recomendado.
- `9`: más inmediato.

## Configuración entregada

La versión actual está preparada para proyector, mouse convencional y trackpad. Antes de modificarla, prueba la presentación en pantalla completa.
