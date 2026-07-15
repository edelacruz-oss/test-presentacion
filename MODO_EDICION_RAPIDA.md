# Modo edición rápida

## Activar o desactivar

Presiona la tecla **E** dentro de la presentación.

- Activado: el scroll, las flechas y la barra espaciadora cambian de escena inmediatamente.
- Desactivado: se restaura la transición cinematográfica estándar de 2.4 segundos.

El cambio es temporal y no modifica el contenido.

## Iniciar siempre en modo rápido

En `configuracion.js`, cambia:

```js
quickModeDefault: false
```

por:

```js
quickModeDefault: true
```

También puedes abrir `index.html?edicion=1` para iniciar una sesión directamente en modo rápido.
