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

The build writes the static site to `docs/` on the `master` branch. Set **Settings → Pages → Build and deployment → Source** to **Deploy from a branch**, then select **master** and **/docs**. After each change, run `npm run build` and commit the updated `docs/` output. Relative asset paths support the repository's project Pages URL.

## Artwork notes

`BME_HEART_LAYERS.svg` is the source artwork. The app keeps the original file intact and adapts it at runtime: it preserves the compound path geometry and layer order, removes the original red strokes, and applies each selected color to its SVG group. The displayed labels are provisional descriptions based on the shapes; update them when physical layer names are available. The repeated square subpaths remain part of the source geometry, so verify the preview against the intended cut files before using this as a cutting-file exporter.
