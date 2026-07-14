# Guía de clases y variables para animaciones

## Motor de animación actual

La versión actual utiliza un motor de **scroll-scrub nativo**, sin dependencias externas:

- `requestAnimationFrame` sincroniza cada frame con el scroll.
- `position: sticky` mantiene la información en el área de presentación.
- Variables CSS controlan opacidad, escala, desplazamiento y desenfoque.
- Canvas 2D mantiene las partículas del fondo.
- `.is-current` identifica la escena activa para la pantalla del presentador.

## Dónde está implementado

- `app.js`, función `renderStory()`: coloca `.scroll-scene` y `.scroll-scene__content`.
- `app.js`, función `initScrollScrub()`: registra todas las escenas.
- `app.js`, función `updateScrollScrub()`: calcula el progreso y actualiza las variables CSS.
- `styles.css`, bloque **SCROLL SCRUB CINEMATOGRÁFICO**: aplica el efecto sticky y las transformaciones.

## Clases nuevas del scroll-scrub

- `.scroll-scrub-enabled`: se agrega al elemento `<html>` cuando el motor está activo.
- `.scroll-scene`: zona completa de recorrido de una escena.
- `.scroll-scene__content`: contenido visual que permanece sticky.
- `.scroll-scene--cover`: configuración especial de la portada.
- `.scroll-scene--chapter`: configuración especial del encabezado de capítulo.
- `.is-scrub-visible`: la escena tiene visibilidad mayor al mínimo.
- `.is-scrub-focused`: la escena está en su zona principal de lectura.
- `[data-scroll-scene]`: atributo disponible para seleccionar cualquier escena.

## Variables CSS actualizadas durante el scroll

### Variables de la escena

- `--scene-progress`: progreso completo entre `0` y `1`.
- `--scene-opacity`: opacidad de la escena.
- `--scene-y`: desplazamiento vertical de entrada o salida.
- `--scene-scale`: escala de la escena.
- `--scene-blur`: desenfoque de la escena.

### Variables de elementos internos

- `--item-opacity`: opacidad individual.
- `--item-y`: desplazamiento individual.
- `--item-scale`: escala individual.
- `--item-blur`: desenfoque individual.
- `--scrub-index`: posición del elemento dentro del escalonado.

## Estados disponibles

- `.is-current`: escena principal sincronizada con el presentador.
- `.is-scrub-visible`: escena entrando, activa o saliendo.
- `.is-scrub-focused`: escena en su máxima zona de lectura.

## Clases únicas por capítulo

- `.section-portada`
- `.section-bienvenida`
- `.section-contexto-institucional`
- `.section-idiomas`
- `.section-daco`
- `.section-hyscom`
- `.section-economico-administrativa`
- `.section-ciencias-sociales`
- `.section-mentoria`
- `.section-proyectos-institucionales`
- `.section-psicopedagogia`
- `.section-voluntariado`
- `.section-vinculacion`
- `.section-cierre`

## Clases únicas para encabezados de capítulo

- `.section-header-bienvenida`
- `.section-header-contexto-institucional`
- `.section-header-idiomas`
- `.section-header-daco`
- `.section-header-hyscom`
- `.section-header-economico-administrativa`
- `.section-header-ciencias-sociales`
- `.section-header-mentoria`
- `.section-header-proyectos-institucionales`
- `.section-header-psicopedagogia`
- `.section-header-voluntariado`
- `.section-header-vinculacion`
- `.section-header-cierre`

## Clases únicas por escena

### 01 · Bienvenida y apertura

- `.scene-bienvenida-01` — hero
- `.scene-bienvenida-02` — statement
- `.scene-bienvenida-03` — cards
- `.scene-bienvenida-04` — quote

### 02 · Contexto institucional

- `.scene-contexto-institucional-01` — hero
- `.scene-contexto-institucional-02` — pillars
- `.scene-contexto-institucional-03` — split
- `.scene-contexto-institucional-04` — flow

### 03 · Idiomas sin fronteras

- `.scene-idiomas-01` — hero
- `.scene-idiomas-02` — timeline
- `.scene-idiomas-03` — metrics
- `.scene-idiomas-04` — gallery

### 04 · DACO

- `.scene-daco-01` — hero
- `.scene-daco-02` — cards
- `.scene-daco-03` — projects
- `.scene-daco-04` — metrics
- `.scene-daco-05` — quote

### 05 · HYSCOM

- `.scene-hyscom-01` — hero
- `.scene-hyscom-02` — cards
- `.scene-hyscom-03` — projects
- `.scene-hyscom-04` — statement

### 06 · Pensamiento emprendedor

- `.scene-economico-administrativa-01` — hero
- `.scene-economico-administrativa-02` — flow
- `.scene-economico-administrativa-03` — statement
- `.scene-economico-administrativa-04` — projects
- `.scene-economico-administrativa-05` — pillars

### 07 · Voces que transforman

- `.scene-ciencias-sociales-01` — hero
- `.scene-ciencias-sociales-02` — metrics
- `.scene-ciencias-sociales-03` — cards
- `.scene-ciencias-sociales-04` — projects
- `.scene-ciencias-sociales-05` — quote

### 08 · Mentoría que acompaña

- `.scene-mentoria-01` — hero
- `.scene-mentoria-02` — flow
- `.scene-mentoria-03` — cards
- `.scene-mentoria-04` — statement
- `.scene-mentoria-05` — metrics

### 09 · Proyectos que dejan huella

- `.scene-proyectos-institucionales-01` — hero
- `.scene-proyectos-institucionales-02` — cards
- `.scene-proyectos-institucionales-03` — statement
- `.scene-proyectos-institucionales-04` — split

### 10 · Psicopedagogía

- `.scene-psicopedagogia-01` — hero
- `.scene-psicopedagogia-02` — pillars
- `.scene-psicopedagogia-03` — timeline
- `.scene-psicopedagogia-04` — split
- `.scene-psicopedagogia-05` — metrics

### 11 · Servir por Amor

- `.scene-voluntariado-01` — hero
- `.scene-voluntariado-02` — statement
- `.scene-voluntariado-03` — pillars
- `.scene-voluntariado-04` — metrics
- `.scene-voluntariado-05` — timeline
- `.scene-voluntariado-06` — quote

### 12 · Vinculación y crecimiento

- `.scene-vinculacion-01` — hero
- `.scene-vinculacion-02` — flow
- `.scene-vinculacion-03` — cards
- `.scene-vinculacion-04` — projects
- `.scene-vinculacion-05` — metrics
- `.scene-vinculacion-06` — quote

### 13 · Cierre y agradecimiento

- `.scene-cierre-01` — hero
- `.scene-cierre-02` — statement
- `.scene-cierre-03` — cards
- `.scene-cierre-04` — quote
- `.scene-cierre-05` — finale

## Clases genéricas de estructura

- `.anim-section`
- `.anim-section-header`
- `.anim-section-meta`
- `.anim-flow`
- `.anim-block`
- `.anim-content`
- `.anim-meta`
- `.anim-panel`
- `.anim-content-head`
- `.anim-grid`
- `.anim-item`

## Clases genéricas de contenido

- `.anim-title`
- `.anim-copy`
- `.anim-eyebrow`
- `.anim-badge`
- `.anim-chip-group`
- `.anim-chip`
- `.anim-orb`
- `.anim-hero`
- `.anim-statement`
- `.anim-finale`
- `.anim-card`
- `.anim-project-card`
- `.anim-metric`
- `.anim-pillar`
- `.anim-flow-step`
- `.anim-timeline-card`
- `.anim-media`
- `.anim-media-overlay`
- `.anim-footnote`
- `.anim-quote`
- `.anim-quote-mark`
- `.anim-quote-text`

## Clases según el tipo de escena

- `.scene-layout-cards`
- `.scene-layout-finale`
- `.scene-layout-flow`
- `.scene-layout-gallery`
- `.scene-layout-hero`
- `.scene-layout-metrics`
- `.scene-layout-pillars`
- `.scene-layout-projects`
- `.scene-layout-quote`
- `.scene-layout-split`
- `.scene-layout-statement`
- `.scene-layout-timeline`

## Clases de posición existentes

- `.layout-left`
- `.layout-right`
- `.layout-center`
- `.layout-wide`
- `.layout-floating`

## Ejemplos de uso con el sistema actual

### Detectar una escena visible

```css
.scene-daco-03.is-scrub-visible .anim-project-card {
  border-color: rgba(var(--accent-rgb), .28);
}
```

### Aplicar un estilo cuando la escena está enfocada

```css
.scene-idiomas-03.is-scrub-focused .anim-metric {
  box-shadow: 0 18px 60px rgba(var(--accent-rgb), .12);
}
```

### Personalizar el origen de una transición

```css
.scene-hyscom-03 .scroll-scene__content {
  transform-origin: 15% 50%;
}
```

### Leer el progreso desde JavaScript

```js
const scene = document.querySelector('.scene-daco-02');
const progress = Number(
  getComputedStyle(scene).getPropertyValue('--scene-progress')
);
```

### Agregar un efecto ligado al progreso

```js
const scene = document.querySelector('.scene-cierre-05');

function updateCustomEffect() {
  const progress = Number(
    getComputedStyle(scene).getPropertyValue('--scene-progress')
  ) || 0;

  scene.style.setProperty('--custom-glow', `${progress * 80}px`);
  requestAnimationFrame(updateCustomEffect);
}

updateCustomEffect();
```

```css
.scene-cierre-05 .anim-finale {
  box-shadow: 0 0 var(--custom-glow, 0px) rgba(var(--accent-rgb), .22);
}
```

## Nota sobre librerías externas

No fue necesario incluir GSAP ni ScrollTrigger. El sistema actual funciona sin conexión y mantiene la animación sincronizada con el scroll mediante `requestAnimationFrame`. Las clases siguen siendo compatibles con una futura integración de GSAP si se requiere una animación especializada.

---

## Clases nuevas de movimiento Scroll Scrub V2

Cada escena recibe automáticamente una de estas clases:

```css
.scroll-motion-top-down
.scroll-motion-left-right
.scroll-motion-right-left
.scroll-motion-center-out
.scroll-motion-center-in
```

También puedes consultar el estilo desde JavaScript:

```js
scene.dataset.scrollStyle
```

Las introducciones de capítulo utilizan:

```css
.scroll-scene--chapter
.chapter-intro-scene
.section-header-nombre-de-seccion
```

Ahora estas introducciones también tienen:

```html
data-view-type="intro"
data-nav-index="..."
```

y forman parte de la navegación con teclado y panel del presentador.

La configuración global se encuentra en `configuracion.js`.
