# Aladdín en dos escenas visuales

La escena principal de Aladdín mantiene el texto original y ahora genera dos secciones de evidencia fotográfica.

## Configuración

En `data.js`, dentro del capítulo `proyectos-institucionales`, la primera diapositiva utiliza:

```javascript
floatingMediaGroups: [
  {
    layout: "collage",
    media: [/* primeras cuatro fotografías */]
  },
  {
    layout: "collage",
    media: [/* últimas tres fotografías */]
  }
]
```

## Archivos principales

- `app.js`: genera una escena visual por cada grupo.
- `presenter.js`: reconoce `FOTOS 1/2` y `FOTOS 2/2`.
- `styles.css`: controla el collage y la adaptación para laptop.
- `assets/logo-cedrus.png`: logo integrado en el header.
