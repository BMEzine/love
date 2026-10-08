import sourceSvg from '../BME_HEART_LAYERS.svg?raw';
import './style.css';

type Layer = { id: string; name: string; position: string };

const layers: Layer[] = [
  { id: 'layer1', name: 'Dots', position: '01' },
  { id: 'layer6', name: 'Center fill', position: '02' },
  { id: 'layer7', name: 'Scrollwork', position: '03' },
  { id: 'layer8', name: 'Heart silhouette', position: '04' },
  { id: 'layer9', name: 'Background', position: '05' },
];

const initialColors = ['#DDD1BD', '#E7B85D', '#779C83', '#CF7868', '#6B7F9B'];
const palettes = [
  { name: 'Simple', colors: ['#C14856', '#F1EFEC', '#C14856', '#FAF9F9', '#6B6B6B'] },
  { name: 'BME light', colors: ['#3C47AC', '#F1EFEC', '#6163BA', '#0A0A0A', '#FAF9F9'] },
  { name: 'BME dark', colors: ['#6163BA', '#1E1E1E', '#F1EFEC', '#6163BA', '#0A0A0A'] },
  { name: 'Plum & ochre', colors: ['#E3D8CE', '#90768F', '#C5A16F', '#B7A7B7', '#758275'] },
  { name: 'Sunset', colors: ['#F2C98D', '#E58E67', '#C95C55', '#9C5363', '#604C68'] },
  { name: 'Sea glass', colors: ['#D6E8D8', '#9CC9BA', '#5FA6A0', '#47828B', '#365D73'] },
  { name: 'Soft lilac', colors: ['#E5C9D3', '#CFA7C3', '#A786B7', '#8479A9', '#637C96'] },
  { name: 'Earth', colors: ['#E5D4B6', '#C7A27B', '#A56D52', '#758064', '#555A50'] },
  { name: 'Rainbow', colors: ['#E85D5D', '#F49A38', '#EAC84A', '#56A878', '#4F82C2'] },
];

const artwork = document.querySelector<HTMLDivElement>('#artwork')!;
const controls = document.querySelector<HTMLDivElement>('#layer-controls')!;
const paletteList = document.querySelector<HTMLDivElement>('#palette-list')!;
const randomPaletteList = document.querySelector<HTMLDivElement>('#random-palette-list')!;
const randomPalettes: string[][] = [];
const savedPaletteList = document.querySelector<HTMLDivElement>('#saved-palette-list')!;
const savedPaletteStorageKey = 'love-heart-saved-palettes';
const collectionOpenStorageKey = 'love-heart-collection-open';
const savedPalettes = readSavedPalettes();
const svgDocument = new DOMParser().parseFromString(sourceSvg, 'image/svg+xml');
const svg = svgDocument.documentElement;
const colorState = new Map<string, string>();

function readSavedPalettes(): string[][] {
  try {
    const saved = JSON.parse(localStorage.getItem(savedPaletteStorageKey) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((colors): colors is string[] =>
      Array.isArray(colors) && colors.length === layers.length && colors.every((color) => typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)),
    ).map((colors) => colors.map((color) => color.toUpperCase()));
  } catch {
    return [];
  }
}

function getCollectionOpenPreference(): boolean {
  try {
    return localStorage.getItem(collectionOpenStorageKey) !== 'false';
  } catch {
    return true;
  }
}

function getColorsFromUrl(): string[] | null {
  const encoded = new URLSearchParams(window.location.search).get('colors');
  if (!encoded) return null;
  const colors = encoded.split(',').map((value) => `#${value.replace(/^#/, '')}`);
  return colors.length === layers.length && colors.every((color) => /^#[\da-f]{6}$/i.test(color))
    ? colors
    : null;
}

function prepareArtwork(): void {
  svg.setAttribute('role', 'presentation');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.removeAttribute('width');
  svg.removeAttribute('height');

  const groups = new Map(layers.map((layer) => [
    layer.id,
    svg.querySelector<SVGGElement>(`#${layer.id}`),
  ]));

  // Opacity was only used in the source for alignment. The physical sheets are
  // opaque, with the full-square backing at the bottom and fine cuts above it.
  for (const group of groups.values()) {
    const path = group?.querySelector<SVGPathElement>('path');
    if (!group || !path) continue;
    group.removeAttribute('style');
    path.removeAttribute('style');
    path.setAttribute('stroke', 'none');
    path.setAttribute('fill-opacity', '1');
    path.setAttribute('fill', '#ffffff');
  }

  // Reorder source groups from the backing up to the top layer.
  layers.forEach((layer) => {
    const group = groups.get(layer.id);
    if (group) svg.appendChild(group);
  });
  artwork.replaceChildren(document.importNode(svg, true));
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const match = l - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, x, 0]
    : hue < 120 ? [x, chroma, 0]
      : hue < 180 ? [0, chroma, x]
        : hue < 240 ? [0, x, chroma]
          : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return [r, g, b].map((value) => Math.round((value + match) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function generateRandomPalette(): string[] {
  const hue = Math.floor(Math.random() * 360);
  return layers.map((_, index) => {
    const layerHue = (hue + index * 47 + Math.floor(Math.random() * 25)) % 360;
    const saturation = 38 + Math.floor(Math.random() * 43);
    const lightness = 35 + Math.floor(Math.random() * 41);
    return `#${hslToHex(layerHue, saturation, lightness)}`;
  });
}

function setColors(colors: string[], updateUrl = true): void {
  layers.forEach((layer, index) => {
    const color = colors[index].toUpperCase();
    colorState.set(layer.id, color);
    const path = artwork.querySelector<SVGPathElement>(`#${layer.id} path`);
    if (path) path.setAttribute('fill', color);
    const input = controls.querySelector<HTMLInputElement>(`#color-${layer.id}`);
    const chip = controls.querySelector<HTMLElement>(`[data-chip="${layer.id}"]`);
    const hex = controls.querySelector<HTMLElement>(`[data-hex="${layer.id}"]`);
    if (input) input.value = color;
    if (chip) chip.style.setProperty('--swatch', color);
    if (hex) hex.textContent = color;
  });
  controls.querySelectorAll<HTMLButtonElement>('[data-layer-color]').forEach((button) => {
    const color = button.dataset.layerColor;
    button.style.setProperty('--swatch', colorState.get(button.dataset.sourceLayer!) ?? color ?? '#ffffff');
    button.setAttribute('aria-label', `Use ${colorState.get(button.dataset.sourceLayer!) ?? color} from ${layers.find((layer) => layer.id === button.dataset.sourceLayer)?.name ?? 'layer'}`);
  });
  if (updateUrl) {
    const params = new URLSearchParams(window.location.search);
    params.set('colors', layers.map((layer) => colorState.get(layer.id)!.slice(1)).join(','));
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  }
}

function renderControls(): void {
  controls.innerHTML = layers.map((layer, index) => `
    <div class="layer-row">
      <span class="layer-index">0${index + 1}</span>
      <span class="layer-name">${layer.name}</span>
      <span class="layer-position">${layer.position}</span>
      <span class="color-input-wrap">
        <button class="color-chip" type="button" data-chip="${layer.id}" aria-label="Choose color for ${layer.name}" aria-expanded="false" aria-controls="picker-${layer.id}"></button>
      </span>
      <span class="hex-value" data-hex="${layer.id}" aria-hidden="true">${initialColors[index]}</span>
      <div class="color-picker" id="picker-${layer.id}" hidden>
        <span class="picker-label">Current layer colors</span>
        <div class="picker-swatches">${layers.map((source) => `
          <button class="picker-swatch" type="button" data-layer-color data-source-layer="${source.id}" aria-label="Use color from ${source.name}" title="${source.name}"></button>
        `).join('')}</div>
        <label class="custom-color-label" for="color-${layer.id}">Custom color</label>
        <input id="color-${layer.id}" class="custom-color-input" type="color" value="${initialColors[index]}" aria-label="Choose a custom color for ${layer.name}" />
      </div>
    </div>
  `).join('');

  for (const layer of layers) {
    const row = controls.querySelector<HTMLElement>(`#picker-${layer.id}`)?.closest('.layer-row');
    const trigger = row?.querySelector<HTMLButtonElement>('[data-chip]');
    const togglePicker = () => {
      const picker = row?.querySelector<HTMLElement>('.color-picker');
      const opening = picker?.hidden ?? false;
      controls.querySelectorAll<HTMLElement>('.color-picker').forEach((item) => { item.hidden = true; });
      controls.querySelectorAll<HTMLButtonElement>('[data-chip]').forEach((item) => item.setAttribute('aria-expanded', 'false'));
      if (picker && opening) {
        picker.hidden = false;
        trigger?.setAttribute('aria-expanded', 'true');
      }
    };
    trigger?.addEventListener('click', togglePicker);
    row?.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.color-picker, .color-chip')) return;
      togglePicker();
    });
    row?.querySelectorAll<HTMLButtonElement>('[data-layer-color]').forEach((button) => {
      button.addEventListener('click', () => {
        const color = colorState.get(button.dataset.sourceLayer!)!;
        const colors = layers.map((item) => colorState.get(item.id)!);
        colors[layers.findIndex((item) => item.id === layer.id)] = color;
        setColors(colors);
        const picker = row.querySelector<HTMLElement>('.color-picker');
        if (picker) picker.hidden = true;
        trigger?.setAttribute('aria-expanded', 'false');
      });
    });
    row?.querySelector<HTMLInputElement>(`#color-${layer.id}`)?.addEventListener('input', (event) => {
      const changed = event.currentTarget as HTMLInputElement;
      const colors = layers.map((item) => colorState.get(item.id)!);
      colors[layers.findIndex((item) => item.id === layer.id)] = changed.value;
      setColors(colors);
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest('.layer-row')) return;
    controls.querySelectorAll<HTMLElement>('.color-picker').forEach((picker) => { picker.hidden = true; });
    controls.querySelectorAll<HTMLButtonElement>('[data-chip]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  });
}

function renderPalettes(): void {
  paletteList.innerHTML = palettes.map((palette) => `
    <button class="palette-button" type="button" aria-label="Use ${palette.name} palette">
      <span class="palette-dots" style="--c1:${palette.colors[0]};--c2:${palette.colors[1]};--c3:${palette.colors[2]};--c4:${palette.colors[3]};--c5:${palette.colors[4]}"></span>
    </button>
  `).join('');
  paletteList.querySelectorAll<HTMLButtonElement>('.palette-button').forEach((button, index) => {
    button.addEventListener('click', () => setColors(palettes[index].colors));
  });
}

function renderRandomPalettes(): void {
  randomPaletteList.innerHTML = randomPalettes.map((colors, index) => `
    <button class="palette-button" type="button" aria-label="Use random palette ${index + 1}">
      <span class="palette-dots" style="--c1:${colors[0]};--c2:${colors[1]};--c3:${colors[2]};--c4:${colors[3]};--c5:${colors[4]}"></span>
    </button>
  `).join('');
  randomPaletteList.querySelectorAll<HTMLButtonElement>('.palette-button').forEach((button, index) => {
    button.addEventListener('click', () => setColors(randomPalettes[index]));
  });
}

function renderSavedPalettes(): void {
  savedPaletteList.innerHTML = savedPalettes.length
    ? savedPalettes.map((colors, index) => `
      <div class="saved-palette-item">
        <button class="palette-button" type="button" aria-label="Apply saved palette ${index + 1}">
          <span class="palette-dots" style="--c1:${colors[0]};--c2:${colors[1]};--c3:${colors[2]};--c4:${colors[3]};--c5:${colors[4]}"></span>
        </button>
        <button class="remove-saved-palette" type="button" aria-label="Remove saved palette ${index + 1}">×</button>
      </div>
    `).join('')
    : '';

  savedPaletteList.querySelectorAll<HTMLButtonElement>('.saved-palette-item > .palette-button').forEach((button, index) => {
    button.addEventListener('click', () => setColors(savedPalettes[index]));
  });
  savedPaletteList.querySelectorAll<HTMLButtonElement>('.remove-saved-palette').forEach((button, index) => {
    button.addEventListener('click', () => {
      const updated = savedPalettes.filter((_, itemIndex) => itemIndex !== index);
      try {
        localStorage.setItem(savedPaletteStorageKey, JSON.stringify(updated));
        savedPalettes.splice(0, savedPalettes.length, ...updated);
        renderSavedPalettes();
      } catch {
        // Leave the saved collection unchanged if storage is unavailable.
      }
    });
  });
}

async function downloadHeart(): Promise<void> {
  const renderedSvg = artwork.querySelector<SVGSVGElement>('svg');
  if (!renderedSvg) return;

  const downloadable = renderedSvg.cloneNode(true) as SVGSVGElement;
  downloadable.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  downloadable.setAttribute('width', '512');
  downloadable.setAttribute('height', '512');
  downloadable.removeAttribute('role');
  downloadable.removeAttribute('aria-hidden');
  downloadable.removeAttribute('focusable');

  const source = new XMLSerializer().serializeToString(downloadable);
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.src = svgUrl;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(image, 0, 0, 512, 512);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png');
    });
    const pngUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'my-bme-heart.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } catch {
    // The browser may not support creating a PNG from the artwork.
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function copyShareLink(): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>('#share-button')!;
  const original = button.innerHTML;
  const params = new URLSearchParams(window.location.search);
  params.set('colors', layers.map((layer) => colorState.get(layer.id)!.slice(1)).join(','));
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  let copied = false;
  try {
    await navigator.clipboard.writeText(url);
    copied = true;
  } catch {
    // Clipboard access may be unavailable in some browsers.
  }
  button.innerHTML = copied
    ? '<span aria-hidden="true">✓</span> Link copied'
    : '<span aria-hidden="true">↗</span> Copy link manually';
  window.setTimeout(() => { button.innerHTML = original; }, 1800);
}

prepareArtwork();
renderControls();
renderPalettes();
randomPalettes.push(...Array.from({ length: 3 }, () => generateRandomPalette()));
renderRandomPalettes();
renderSavedPalettes();
const collectionSection = document.querySelector<HTMLDetailsElement>('.collection-section')!;
collectionSection.open = savedPalettes.length === 0 || getCollectionOpenPreference();
collectionSection.addEventListener('toggle', () => {
  if (savedPalettes.length === 0) {
    if (!collectionSection.open) collectionSection.open = true;
    return;
  }
  try {
    localStorage.setItem(collectionOpenStorageKey, String(collectionSection.open));
  } catch {
    // Keep the current disclosure state for this session if storage is unavailable.
  }
});
setColors(getColorsFromUrl() ?? initialColors, false);

document.querySelector<HTMLButtonElement>('#save-palette-button')?.addEventListener('click', () => {
  const colors = layers.map((layer) => colorState.get(layer.id)!);
  const updated = [...savedPalettes, colors];
  try {
    localStorage.setItem(savedPaletteStorageKey, JSON.stringify(updated));
    savedPalettes.push(colors);
    renderSavedPalettes();
    collectionSection.open = true;
    try {
      localStorage.setItem(collectionOpenStorageKey, 'true');
    } catch {
      // Saved colors remain available for this session if preference storage fails.
    }
  } catch {
    // Storage may be unavailable or full.
  }
});

document.querySelector<HTMLButtonElement>('#surprise-button')?.addEventListener('click', () => {
  randomPalettes.unshift(generateRandomPalette());
  randomPalettes.length = 3;
  renderRandomPalettes();
  setColors(randomPalettes[0]);
});
document.querySelector<HTMLButtonElement>('#download-button')?.addEventListener('click', downloadHeart);
document.querySelector<HTMLButtonElement>('#share-button')?.addEventListener('click', copyShareLink);
