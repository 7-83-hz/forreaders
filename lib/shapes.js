export const COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
export const SHAPE_KINDS = ['cube', 'pyramid', 'diamond', 'blob'];

export function colorFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function kindFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return SHAPE_KINDS[h % SHAPE_KINDS.length];
}

export function faceMarkupFor(kind, color, depth) {
  const c = `var(--${color})`;

  if (kind === 'cube') {
    return `
      <div class="face" style="background:${c}; opacity:.95; transform: translateZ(${depth}px);"></div>
      <div class="face" style="background:${c}; opacity:.55; transform: translateZ(-${depth}px) rotateY(180deg);"></div>
      <div class="face" style="background:${c}; opacity:.8; transform: rotateY(90deg) translateZ(${depth}px);"></div>
      <div class="face" style="background:${c}; opacity:.65; transform: rotateY(-90deg) translateZ(${depth}px);"></div>
      <div class="face" style="background:${c}; opacity:.9; transform: rotateX(90deg) translateZ(${depth}px);"></div>
      <div class="face" style="background:${c}; opacity:.45; transform: rotateX(-90deg) translateZ(${depth}px);"></div>
    `;
  }

  if (kind === 'diamond') {
    return `
      <div class="face" style="background:${c}; opacity:.9; border-radius:50%; transform: translateZ(${depth}px) scale(0.85);"></div>
      <div class="face" style="background:${c}; opacity:.5; border-radius:50%; transform: translateZ(-${depth}px) rotateY(180deg) scale(0.85);"></div>
      <div class="face" style="background:${c}; opacity:.7; border-radius:50%; transform: rotateY(90deg) translateZ(${depth}px) scale(0.85);"></div>
      <div class="face" style="background:${c}; opacity:.6; border-radius:50%; transform: rotateY(-90deg) translateZ(${depth}px) scale(0.85);"></div>
      <div class="face" style="background:${c}; opacity:.8; border-radius:50%; transform: rotateX(90deg) translateZ(${depth}px) scale(0.85);"></div>
      <div class="face" style="background:${c}; opacity:.4; border-radius:50%; transform: rotateX(-90deg) translateZ(${depth}px) scale(0.85);"></div>
    `;
  }

  if (kind === 'pyramid') {
    const half = depth;
    return `
      <div class="face" style="background:${c}; opacity:.9; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); transform: translateZ(${half * 0.5}px) rotateX(15deg);"></div>
      <div class="face" style="background:${c}; opacity:.55; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); transform: translateZ(-${half * 0.5}px) rotateY(180deg) rotateX(15deg);"></div>
      <div class="face" style="background:${c}; opacity:.7; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); transform: rotateY(90deg) translateZ(${half * 0.5}px) rotateX(15deg);"></div>
      <div class="face" style="background:${c}; opacity:.65; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); transform: rotateY(-90deg) translateZ(${half * 0.5}px) rotateX(15deg);"></div>
      <div class="face" style="background:${c}; opacity:.4; transform: rotateX(90deg) translateZ(${half * 0.5}px) scale(0.9);"></div>
    `;
  }

  return `
    <div class="face" style="background:${c}; opacity:.9; border-radius:42% 58% 65% 35% / 45% 40% 60% 55%; transform: translateZ(${depth}px);"></div>
    <div class="face" style="background:${c}; opacity:.5; border-radius:58% 42% 35% 65% / 55% 60% 40% 45%; transform: translateZ(-${depth}px) rotateY(180deg);"></div>
    <div class="face" style="background:${c}; opacity:.75; border-radius:50%; transform: rotateY(90deg) translateZ(${depth * 0.8}px);"></div>
    <div class="face" style="background:${c}; opacity:.6; border-radius:50%; transform: rotateY(-90deg) translateZ(${depth * 0.8}px);"></div>
    <div class="face" style="background:${c}; opacity:.8; border-radius:50%; transform: rotateX(90deg) translateZ(${depth * 0.8}px);"></div>
    <div class="face" style="background:${c}; opacity:.45; border-radius:50%; transform: rotateX(-90deg) translateZ(${depth * 0.8}px);"></div>
  `;
}

export function layoutFor(id) {
  const size = 54 + ((id.length * 7) % 40);
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 13 + id.charCodeAt(i)) >>> 0;

  const top = 8 + (seed % 7800) / 100;
  const left = 4 + ((seed >> 8) % 8800) / 100;
  const dur = 9 + ((seed >> 16) % 1000) / 100;
  const delay = -((seed >> 20) % 1000) / 100;

  return { size, top, left, dur, delay, depth: size / 2 };
}
