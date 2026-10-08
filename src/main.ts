import sourceSvg from '../BME_HEART_LAYERS.svg?raw';
import './style.css';

type Layer = { id: string; name: string; position: string };

const layers: Layer[] = [
  { id: 'layer1', name: 'Square background', position: 'BASE' },
  { id: 'layer6', name: 'Center details', position: '04' },
  { id: 'layer7', name: 'Scrollwork', position: '03' },
  { id: 'layer8', name: 'Heart silhouette', position: '02' },
  { id: 'layer9', name: 'Outer layer', position: 'TOP' },
];

const initialColors = ['#DDD1BD', '#E7B85D', '#779C83', '#CF7868', '#6B7F9B'];
const palettes = [
  { name: 'Garden', colors: ['#E8B4A3', '#E7C66B', '#779C83', '#CF7868', '#6B7F9B'] },
  { name: 'Sunset', colors: ['#F2C98D', '#E58E67', '#C95C55', '#9C5363', '#604C68'] },
  { name: 'Sea glass', colors: ['#D6E8D8', '#9CC9BA', '#5FA6A0', '#47828B', '#365D73'] },
  { name: 'Soft lilac', colors: ['#E5C9D3', '#CFA7C3', '#A786B7', '#8479A9', '#637C96'] },
  { name: 'Earth', colors: ['#E5D4B6', '#C7A27B', '#A56D52', '#758064', '#555A50'] },
];

const artwork = document.querySelector<HTMLDivElement>('#artwork')!;
const controls = document.querySelector<HTMLDivElement>('#layer-controls')!;
const paletteList = document.querySelector<HTMLDivElement>('#palette-list')!;
const shareStatus = document.querySelector<HTMLParagraphElement>('#share-status')!;
const svgDocument = new DOMParser().parseFromString(sourceSvg, 'image/svg+xml');
const svg = svgDocument.documentElement;
const colorState = new Map<string, string>();

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

  // Reorder source groups from the backing up to the top paper sheet.
  layers.forEach((layer) => {
    const group = groups.get(layer.id);
    if (group) svg.appendChild(group);
  });
  artwork.replaceChildren(document.importNode(svg, true));
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
  shareStatus.textContent = '';
  if (updateUrl) {
    const params = new URLSearchParams(window.location.search);
    params.set('colors', layers.map((layer) => colorState.get(layer.id)!.slice(1)).join(','));
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  }
}

function renderControls(): void {
  controls.innerHTML = layers.map((layer, index) => `
    <label class="layer-row" for="color-${layer.id}">
      <span class="layer-index">0${index + 1}</span>
      <span class="layer-name">${layer.name}</span>
      <span class="layer-position">${layer.position}</span>
      <span class="color-input-wrap">
        <span class="color-chip" data-chip="${layer.id}" aria-hidden="true"></span>
        <input id="color-${layer.id}" type="color" value="${initialColors[index]}" aria-label="Choose color for ${layer.name}" />
      </span>
      <span class="hex-value" data-hex="${layer.id}" aria-hidden="true">${initialColors[index]}</span>
    </label>
  `).join('');

  for (const layer of layers) {
    controls.querySelector<HTMLInputElement>(`#color-${layer.id}`)?.addEventListener('input', (event) => {
      const changed = event.currentTarget as HTMLInputElement;
      const colors = layers.map((item) => colorState.get(item.id)!);
      colors[layers.findIndex((item) => item.id === layer.id)] = changed.value;
      setColors(colors);
    });
  }
}

function renderPalettes(): void {
  paletteList.innerHTML = palettes.map((palette) => `
    <button class="palette-button" type="button" aria-label="Use ${palette.name} palette" title="${palette.name}">
      <span class="palette-dots" style="--c1:${palette.colors[0]};--c2:${palette.colors[1]};--c3:${palette.colors[2]};--c4:${palette.colors[3]};--c5:${palette.colors[4]}"></span>
    </button>
  `).join('');
  paletteList.querySelectorAll<HTMLButtonElement>('.palette-button').forEach((button, index) => {
    button.addEventListener('click', () => setColors(palettes[index].colors));
  });
}

async function copyShareLink(): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>('#share-button')!;
  const original = button.innerHTML;
  const params = new URLSearchParams(window.location.search);
  params.set('colors', layers.map((layer) => colorState.get(layer.id)!.slice(1)).join(','));
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = 'Your link is copied and ready to share.';
  } catch {
    shareStatus.textContent = 'Copy this link from your browser’s address bar.';
  }
  button.innerHTML = '<span aria-hidden="true">✓</span> Link copied';
  window.setTimeout(() => { button.innerHTML = original; }, 1800);
}

prepareArtwork();
renderControls();
renderPalettes();
setColors(getColorsFromUrl() ?? initialColors, false);

document.querySelector<HTMLButtonElement>('#reset-button')?.addEventListener('click', () => {
  setColors(initialColors);
  shareStatus.textContent = 'Back to the original colors.';
});
document.querySelector<HTMLButtonElement>('#surprise-button')?.addEventListener('click', () => {
  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  setColors(palette.colors);
  shareStatus.textContent = `A little ${palette.name.toLowerCase()} inspiration.`;
});
document.querySelector<HTMLButtonElement>('#share-button')?.addEventListener('click', copyShareLink);
