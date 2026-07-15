# Guía de fotografías ampliadas

## Nuevos layouts visuales

- `carousel`: muestra una secuencia de fotografías dentro de una misma escena de evidencia visual.

## Secciones ampliadas

### 1. Proyectos institucionales · Aladdín
Se agregaron fotografías extra del escenario y del elenco:
- `aladdin-escena-01`
- `aladdin-escena-02`
- `aladdin-escena-03`
- `aladdin-escena-04`
- `aladdin-escena-05`
- `aladdin-escena-06`

### 2. Psicopedagogía · Capacitaciones y formación continua
Se agregaron evidencias visuales complementarias:
- `capacitaciones-01`
- `capacitaciones-02`
- `capacitaciones-03`
- `capacitaciones-04`
- `capacitaciones-05`
- `capacitaciones-06`

### 3. Academia Económico-Administrativa
Se añadieron imágenes extra en el Proyecto Integrador:
- `economico-extra-01`
- `economico-extra-02`

## Dónde editar

- `data.js`: define qué fotos usa cada escena.
- `styles.css`: incluye el bloque `.floating-layout-carousel`.
- `app.js`: pasa `--photo-index` y `--photo-count` para animar el carrusel.


## Cambio de layout en evidencias

Las escenas ampliadas ahora usan `collage` en lugar de `carousel`, para que todas las fotos sean visibles al mismo tiempo sin sobreponerse.
