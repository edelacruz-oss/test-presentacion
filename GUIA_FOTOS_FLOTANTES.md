# Guía de fotografías flotantes

Las fotografías fueron seleccionadas del informe anual para complementar los momentos con mayor valor visual sin saturar la presentación.

## Cómo sustituir una fotografía

1. Abre la carpeta `assets/`.
2. Localiza el nombre indicado en esta guía.
3. Sustituye el archivo conservando exactamente el mismo nombre y extensión.
4. Recarga la presentación.

También puedes usar otra extensión (`.webp`, `.png`, `.jpg` o `.jpeg`) si conservas la parte principal del nombre.

## Fotografías por sección

### Contexto institucional

- `contexto-campus.jpg`: portada visual del campus y lema institucional.
- `contexto-equipo.jpg`: comunidad y trabajo colaborativo.

### Idiomas

- `idiomas-londres-01.jpg`: experiencia en Londres.
- `idiomas-londres-02.jpg`: medallas y resultados de la experiencia internacional.
- `idiomas-intercambio-01.jpg`: movilidad e intercambio académico.

### DACO

- `daco-visita-arquitectonica.jpg`: visita y análisis de espacios arquitectónicos.
- `daco-mental-kombat.jpg`: evidencia del rally interdisciplinario.
- `daco-casa-ideal.jpg`: proyecto arquitectónico accesible.

### HYSCOM

- `hyscom-laboratorio.jpg`: práctica científica.
- `hyscom-comunidad.jpg`: servicio comunitario.
- `hyscom-disbiosis.jpg`: presentación del proyecto Disbiosis.
- `hyscom-productos-sin-plastico.jpg`: soluciones sustentables.
- `hyscom-burbujas.jpg`: proyecto Burbujas explosivas.
- `hyscom-ecocicla.jpg`: separación de residuos.

### Academia Económico-Administrativa

- `economico-encuentro.jpg`: Encuentro Interinstitucional.
- `economico-proyecto-taak.jpg`: presentación de Taak Couture.
- `economico-presentacion.jpg`: exposición ante sinodales.

### Ciencias Sociales

- `sociales-debate.png`: participación en debate académico.
- `sociales-logro.jpg`: encuentro y participación entre preparatorias.
- `sociales-oratoria.jpg`: Concurso de Oratoria.

### Mentoría

- `mentoria-convivencia.png`: integración, convivencia y pertenencia.

### Proyectos institucionales

- `aladdin-escenario.jpg`: producción artística Aladdín.
- `familias-taller.jpg`: talleres para madres y padres.

### Psicopedagogía

- `psicopedagogia-formacion.jpg`: formación y actualización docente.

### Voluntariado

- `voluntariado-comunidad.jpg`: servicio directo a la comunidad.
- `voluntariado-hospital.jpg`: acción solidaria en contexto hospitalario.

### Vinculación

- `vinculacion-convenio.jpg`: alianzas y convenios institucionales.

### Cierre

- `cierre-equipo.png`: equipo y comunidad que hicieron posible el ciclo.

## Código de las galerías

En `data.js`, cada escena puede incluir:

```js
floatingLayout: 'duo-overlap',
floatingMedia: [
  {
    key: 'daco-visita-arquitectonica',
    label: 'Análisis arquitectónico',
    caption: 'Observación directa en espacios históricos.'
  },
  {
    key: 'daco-mental-kombat',
    label: 'Mental Kombat',
    caption: 'Conocimiento aplicado en equipo.'
  }
]
```

Diseños disponibles:

- `single-wide`
- `single-offset`
- `single-cinematic`
- `duo-overlap`
- `trio`

Las funciones que generan las imágenes están en `app.js`:

- `createGallery()`
- `createFloatingMedia()`
- `hydrateMediaSlots()`

Los estilos y la animación están al final de `styles.css`, en el bloque:

```css
GALERÍAS Y FOTOGRAFÍAS FLOTANTES
```
