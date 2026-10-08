# LOVE

A small client-side color studio for the layered heart SVG. It runs as a static site and can be deployed to GitHub Pages; the current colors are encoded in the URL so designs can be shared without accounts or a backend.

## Local development

```sh
npm install
npm run dev
```

## Build and preview

```sh
npm run build
npm run preview
```

## Deploy to GitHub Pages

The build writes the static site to `docs/` on the `main` branch. Set **Settings → Pages → Build and deployment → Source** to **Deploy from a branch**, then select **main** and **/docs**. After each change, run `npm run build` and commit the updated `docs/` output. Relative asset paths support the repository's project Pages URL.

## Artwork notes

`BME_HEART_LAYERS.svg` is the source artwork. The app keeps the original file intact and adapts it at runtime: it removes the source's alignment-only opacity and red strokes, makes the paper layers opaque, and applies each selected color. It stacks the plain full-square `layer1` as the backing, then builds upward through the cut layers. Display labels are provisional descriptions based on the shapes; update them if the physical layer names differ. The preview is for color exploration, not a cutting-file exporter.
