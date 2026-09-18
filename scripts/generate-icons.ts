/**
 * Generates the favicons + PWA icons from the ShiftedTone logo bars.
 * Zero dependencies: draws pixels into a buffer and encodes PNGs
 * (zlib via node, CRC32 inline) — plus a real multi-size .ico wrapper.
 *
 * Run: bun scripts/generate-icons.ts
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

type RGB = [number, number, number];

const INK: RGB = [46, 32, 25];
const PAPER: RGB = [249, 238, 221];
const SUN: RGB = [247, 183, 51];
const MINT: RGB = [129, 178, 154];
const CORAL: RGB = [232, 115, 90];

/** One logo bar: x offset, y offset, width, height (in a 512px canvas). */
const BARS: { x: number; y: number; w: number; h: number; c: RGB }[] = [
  { x: 92, y: 182, w: 52, h: 148, c: SUN },
  { x: 176, y: 112, w: 52, h: 288, c: PAPER },
  { x: 260, y: 212, w: 52, h: 88, c: CORAL },
  { x: 344, y: 152, w: 52, h: 208, c: MINT },
];

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function encodePng(w: number, h: number, rgba: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // stride = w*4 + filter byte
  const stride = w * 4 + 1;
  const raw = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // filter: none
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * stride + 1);
  }
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", new Uint8Array(deflateSync(raw, { level: 9 }))),
    pngChunk("IEND", new Uint8Array(0)),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/**
 * Render the logo at `size`. Padding fraction shrinks the bars inside the
 * canvas (maskable icons need ~10% safe zone on every edge).
 */
function renderLogo(size: number, padFrac = 0): Uint8Array {
  const rgba = new Uint8Array(size * size * 4);
  const scale = size / 512;

  const put = (x: number, y: number, c: RGB) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    rgba[i] = c[0];
    rgba[i + 1] = c[1];
    rgba[i + 2] = c[2];
    rgba[i + 3] = 255;
  };

  const pad = Math.round(size * padFrac);
  const inner = size - pad * 2;
  for (const b of BARS) {
    const bx = pad + Math.round((b.x / 512) * inner);
    const by = pad + Math.round((b.y / 512) * inner);
    const bw = Math.max(1, Math.round((b.w / 512) * inner));
    const bh = Math.max(1, Math.round((b.h / 512) * inner));
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) {
        // Sample at the canvas' scale to keep thin bars crisp at 16-32px.
        put(x, y, b.c);
      }
    }
  }
  return rgba;
}

// 192/512 "any" icons: full-bleed ink background with the four bars.
for (const size of [192, 512]) {
  const bg = new Uint8Array(size * size * 4);
  for (let i = 0; i < bg.length; i += 4) {
    bg[i] = INK[0];
    bg[i + 1] = INK[1];
    bg[i + 2] = INK[2];
    bg[i + 3] = 255;
  }
  const bars = renderLogo(size);
  for (let i = 0; i < bg.length; i += 4) {
    if (bars[i + 3] === 255) {
      bg[i] = bars[i];
      bg[i + 1] = bars[i + 1];
      bg[i + 2] = bars[i + 2];
    }
  }
  writeFileSync(`public/icon-${size}.png`, encodePng(size, size, bg));
  console.log(`public/icon-${size}.png`);
}

// Maskable: same art, but with a 10% safe zone so circle crops keep the bars.
{
  const size = 512;
  const bg = new Uint8Array(size * size * 4);
  for (let i = 0; i < bg.length; i += 4) {
    bg[i] = INK[0];
    bg[i + 1] = INK[1];
    bg[i + 2] = INK[2];
    bg[i + 3] = 255;
  }
  const bars = renderLogo(size, 0.1);
  for (let i = 0; i < bg.length; i += 4) {
    if (bars[i + 3] === 255) {
      bg[i] = bars[i];
      bg[i + 1] = bars[i + 1];
      bg[i + 2] = bars[i + 2];
    }
  }
  writeFileSync("public/icon-maskable-512.png", encodePng(size, size, bg));
  console.log("public/icon-maskable-512.png");
}

// Transparent-background icons for the .ico (favicons look best without a box).
function transparentLogo(size: number): Uint8Array {
  const rgba = new Uint8Array(size * size * 4);
  const scale = size / 512;
  const put = (x: number, y: number, c: RGB) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    rgba[i] = c[0];
    rgba[i + 1] = c[1];
    rgba[i + 2] = c[2];
    rgba[i + 3] = 255;
  };
  for (const b of BARS) {
    const bx = Math.round(b.x * scale);
    const by = Math.round(b.y * scale);
    const bw = Math.max(1, Math.round(b.w * scale));
    const bh = Math.max(1, Math.round(b.h * scale));
    for (let y = by; y < by + bh; y++)
      for (let x = bx; x < bx + bw; x++) put(x, y, b.c);
  }
  return rgba;
}

// Multi-size .ico: PNG-compressed entries (Vista+ format), transparent bg.
const sizes = [16, 32, 48];
const pngs = sizes.map((s) => encodePng(s, s, transparentLogo(s)));
const headerSize = 6 + sizes.length * 16;
const offsets: number[] = [];
let cursor = headerSize;
for (const p of pngs) {
  offsets.push(cursor);
  cursor += p.length;
}
const ico = new Uint8Array(cursor);
const dv = new DataView(ico.buffer);
dv.setUint16(0, 0, true); // reserved
dv.setUint16(2, 1, true); // type: icon
dv.setUint16(4, sizes.length, true); // image count
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  ico[e] = s === 256 ? 0 : s; // width
  ico[e + 1] = s === 256 ? 0 : s; // height
  ico[e + 2] = 0; // palette
  ico[e + 3] = 0; // reserved
  dv.setUint16(e + 4, 1, true); // planes
  dv.setUint16(e + 6, 32, true); // bpp
  dv.setUint32(e + 8, pngs[i].length, true);
  dv.setUint32(e + 12, offsets[i], true);
  ico.set(pngs[i], offsets[i]);
});
writeFileSync("public/favicon.ico", ico);
console.log("public/favicon.ico");
