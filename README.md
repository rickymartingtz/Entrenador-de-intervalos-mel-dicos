# Entrenador de intervalos melódicos

Proyecto React/Vite para un entrenador de intervalos melódicos con:

- Generación de sucesiones de 2 a 24 notas.
- Selección de intervalos.
- Claves de sol, do en tercera y fa.
- Renderizado de partitura con VexFlow.
- Fuentes de sonido SoundFont: voz/coro, órgano, cuerdas, cello, pianos, marimba, vibráfono, glockenspiel y bajo.
- Respaldo sintético con Web Audio API si no cargan las muestras externas.

## Requisitos

Instala Node.js y npm.

## Uso local

```bash
npm install
npm run dev
```

Después abre la URL local que muestre Vite, normalmente:

```bash
http://localhost:5173
```

## Compilar para producción

```bash
npm run build
```

La carpeta final se genera en:

```bash
dist/
```

## Vista previa de producción

```bash
npm run preview
```

## Notas de audio

La app carga `soundfont-player` desde CDN y descarga instrumentos del repositorio `midi-js-soundfonts` cuando presionas reproducir por primera vez. La primera reproducción de cada instrumento puede tardar un poco. Después queda en caché durante la sesión del navegador.

Si falla la carga externa, la app usa síntesis interna por Web Audio API para seguir funcionando.

## Publicar en GitHub

```bash
git init
git add .
git commit -m "Initial interval trainer app"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

## Publicar en Vercel o Netlify

Comando de build:

```bash
npm run build
```

Directorio de publicación:

```bash
dist
```
