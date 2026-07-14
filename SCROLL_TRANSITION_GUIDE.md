# Guía de transición estandarizada para laptop

## Principio de funcionamiento

La versión anterior interpretaba directamente la cantidad de desplazamiento producida por cada mouse o trackpad. Eso podía hacer que el ritmo se sintiera diferente al cambiar entre una TV y una laptop.

Esta edición utiliza navegación por escenas:

1. Un gesto de scroll identifica la dirección.
2. Se selecciona una sola escena anterior o siguiente.
3. El movimiento completo se ejecuta durante un tiempo fijo.
4. Mientras la transición está activa, las órdenes adicionales se bloquean.

El resultado es consistente sin importar la resolución.

## Ajuste principal

En `configuracion.js`:

```js
timing: {
  standardTransitionDurationMs: 2400,
  lockInputDuringTransition: true
}
```

`standardTransitionDurationMs` controla simultáneamente:

- scroll y trackpad;
- flechas del teclado;
- barra espaciadora;
- controles de la pantalla del presentador;
- saltos programáticos entre escenas.

## Valores recomendados

```js
standardTransitionDurationMs: 2000 // Ágil
standardTransitionDurationMs: 2200 // Suave
standardTransitionDurationMs: 2400 // Recomendado para laptop
standardTransitionDurationMs: 2600 // Inmersivo
standardTransitionDurationMs: 2800 // Cinematográfico
```

## Sensibilidad del scroll

```js
wheelStepThresholdPx: 46,
wheelGestureCooldownMs: 360
```

- `wheelStepThresholdPx` determina cuánto debe moverse la rueda antes de cambiar de escena.
- `wheelGestureCooldownMs` evita que la inercia del trackpad active una segunda transición.

No es necesario modificar estos valores para el uso normal en laptop.

## Altura uniforme

```js
sceneScrollHeightVh: 168,
chapterIntroScrollHeightVh: 168,
coverScrollHeightVh: 168
```

Al mantener la misma altura relativa, portada, introducciones y contenido recorren una distancia visual equivalente.
