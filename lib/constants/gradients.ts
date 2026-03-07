export type Gradient = {
  name: string;
  colors: string[];
};

export const gradients: Gradient[] = [
  { name: 'Sunset', colors: ['#ff7e5f', '#feb47b'] },
  {
    name: 'Life is Beautiful',
    colors: ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'],
  },
  { name: 'Ocean Blue', colors: ['#2193b0', '#6dd5ed'] },
  { name: 'Purple Love', colors: ['#cc2b5e', '#753a88'] },
  { name: 'Aqua Marine', colors: ['#1A2980', '#26D0CE'] },
  { name: 'Bloody Mary', colors: ['#FF512F', '#DD2476'] },
  { name: 'Mojito', colors: ['#1D976C', '#93F9B9'] },
  { name: 'Flare', colors: ['#f12711', '#f5af19'] },
  { name: 'Green Beach', colors: ['#02AAB0', '#00CDAC'] },
  { name: 'Grapefruit Sunset', colors: ['#e96443', '#904e95'] },
  { name: 'Shifter', colors: ['#bc4e9c', '#f80759'] },
  { name: 'Emerald Water', colors: ['#348F50', '#56B4D3'] },
  { name: 'Cool Blues', colors: ['#2193b0', '#6dd5ed'] },
  { name: 'MegaTron', colors: ['#C6FFDD', '#FBD786', '#f7797d'] },
  { name: 'Pink Paradise', colors: ['#e1eec3', '#f05053'] },
  { name: 'Cherry', colors: ['#EB3349', '#F45C43'] },
  { name: 'Sky', colors: ['#76b852', '#8DC26F'] },
  { name: 'Purple Bliss', colors: ['#360033', '#0b8793'] },
  { name: 'Steel Gray', colors: ['#485563', '#29323c'] },
  { name: 'Peach', colors: ['#ED4264', '#FFEDBC'] },
];

export const getGradientByName = (name?: string): Gradient =>
  gradients.find((g) => g.name === name) ?? gradients[0];

export const getRandomGradient = (): Gradient =>
  gradients[Math.floor(Math.random() * gradients.length)];

// Deterministic pick by string key (conversation id, user id, etc.)
export const getGradientForKey = (key?: string): Gradient => {
  if (!key) return gradients[0];
  // Simple hash function
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const idx = h % gradients.length;
  return gradients[idx];
};
