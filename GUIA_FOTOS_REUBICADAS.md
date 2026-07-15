# Guía de fotografías reubicadas

Esta versión evita que las fotografías compitan por el alto disponible de la pantalla.

## Lógica aplicada

### Fotografía lateral

Cuando una escena tiene una sola imagen y el contenido es breve (`hero`, `statement`, `quote` o `finale`), la fotografía se coloca junto a la información.

La posición cambia automáticamente:

- si el contenido está a la izquierda, la fotografía aparece a la derecha;
- si el contenido está a la derecha, la fotografía aparece a la izquierda;
- en composiciones centradas, se alterna la posición.

### Momento fotográfico independiente

Cuando hay dos o más fotografías, o cuando la escena contiene tarjetas, proyectos, métricas, pilares o líneas de tiempo, se crea un momento adicional llamado **Evidencia visual**.

Esto permite que:

- todas las fotos sean visibles;
- no queden debajo del área útil de la laptop;
- mantengan su animación flotante;
- puedan recorrerse con scroll, teclado y pantalla del presentador.

## Configuración manual por escena

En `data.js` puedes decidir la posición con:

```javascript
floatingPlacement: 'side'
```

O forzar una escena fotográfica independiente:

```javascript
floatingPlacement: 'scene'
```

También puedes personalizar el encabezado de la escena fotográfica:

```javascript
floatingTitle: 'Momentos destacados',
floatingSubtitle: 'Evidencias del trabajo realizado durante el ciclo.'
```

## Clases principales

### Composición lateral

```css
.scene-has-side-media
.block-shell.has-side-media
.media-side-left
.media-side-right
.floating-media-side
```

### Escena fotográfica independiente

```css
.photo-showcase-scene
.photo-showcase__content
.photo-showcase__header
.floating-media-showcase
```

### Fotografías

```css
.floating-photo
.floating-photo__surface
.floating-photo__caption
.floating-photo__glow
```

## Archivos relevantes

- `app.js`: decide si la fotografía va al costado o en una escena independiente.
- `styles.css`: contiene la composición lateral, las galerías amplias y el movimiento flotante.
- `presenter.js`: reconoce el nuevo momento `FOTOS` en la pantalla del presentador.
- `data.js`: contiene las imágenes seleccionadas y sus textos de contexto.
