# Entrenador melódico de intervalos

Proyecto React + Vite para generar sucesiones melódicas por intervalos, reproducirlas y mostrar la respuesta en partitura.

## Qué cambió en esta versión

Esta versión carga `soundfont-player` como dependencia npm, no como script externo improvisado. Eso evita que la app caiga silenciosamente al motor sintético por no encontrar la librería.

Los instrumentos con muestras reales usan los SoundFonts pre-renderizados de `midi-js-soundfonts`:

- Voz / coro: `choir_aahs`
- Voz oohs: `voice_oohs`
- Órgano: `church_organ`
- Cuerdas: `string_ensemble_1`
- Violonchelo: `cello`
- Piano acústico: `acoustic_grand_piano`
- Piano brillante: `bright_acoustic_piano`
- Marimba: `marimba`
- Vibráfono: `vibraphone`
- Glockenspiel: `glockenspiel`
- Bajo acústico: `acoustic_bass`

La app conserva un motor sintético interno como respaldo. Si estás sin internet, si el servidor de muestras falla o si el navegador bloquea la descarga, verás un aviso y se usará ese respaldo.

## Requisitos

- Node.js 18 o superior
- npm
- Internet para cargar las muestras SoundFont la primera vez que reproduces un instrumento

## Instalar

```bash
npm install
```

## Correr en desarrollo

```bash
npm run dev
```

Abre la URL que Vite muestre en la terminal, normalmente:

```text
http://localhost:5173
```

## Compilar para producción

```bash
npm run build
```

Los archivos listos para publicar quedan en la carpeta:

```text
dist/
```

## Vista previa de la compilación

```bash
npm run preview
```

## Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin TU_URL_DE_GITHUB
git push -u origin main
```

## Nota sobre los sonidos

La primera vez que selecciones un instrumento puede tardar algunos segundos porque el navegador descarga las muestras. Después se guardan en caché durante la sesión.

Para comprobar que sí están cargando las muestras reales, selecciona `Piano acústico`, presiona `Escuchar` y revisa el texto bajo el selector de instrumento. Debe decir algo como:

```text
Sonido SoundFont activo: Piano acústico.
```

Si dice que usa síntesis interna, abre la consola del navegador con F12 para ver el error exacto.
