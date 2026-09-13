/**
 * Generates public/og.png — the 1200x630 share card ("app face") for
 * ShiftedTone. Zero dependencies: draws pixels into a buffer and encodes
 * a valid PNG (zlib via node, CRC32 implemented inline).
 *
 * Run: bun scripts/generate-og.ts
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

type RGB = [number, number, number];

const W = 1200;
const H = 630;

// Warm neobrutalism palette (matches src/index.css)
const INK: RGB = [46, 32, 25]; // #2e2019
const PAPER: RGB = [249, 238, 221]; // #f9eedd
const CARD: RGB = [255, 250, 242]; // #fffaf2
const SUN: RGB = [247, 183, 51]; // #f7b733
const MINT: RGB = [129, 178, 154]; // #81b29a
const CORAL: RGB = [232, 115, 90]; // #e8735a

const px = new Uint8Array(W * H * 3);

function set(x: number, y: number, c: RGB) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function rect(x0: number, y0: number, w: number, h: number, c: RGB) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) set(x, y, c);
  }
}

function frame(x0: number, y0: number, w: number, h: number, t: number, c: RGB) {
  rect(x0, y0, w, t, c);
  rect(x0, y0 + h - t, w, t, c);
  rect(x0, y0, t, h, c);
  rect(x0 + w - t, y0, t, h, c);
}

// 5x7 pixel font, uppercase A-Z, 0-9, punctuation. Rows are bit patterns.
const FONT: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10011, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ",": [0, 0, 0, 0, 0b00100, 0b00100, 0b01000],
  "'": [0b00110, 0b00110, 0b00100, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0b00100, 0b00100],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0, 0b00100],
  "—": [0, 0, 0, 0b11111, 0, 0, 0],
  "-": [0, 0, 0, 0b01110, 0, 0, 0],
  ":": [0, 0b00100, 0b00100, 0, 0b00100, 0b00100, 0],
  " ": [0, 0, 0, 0, 0, 0, 0],
};

/**
 * Draw text with hard offset shadow. Returns end x.
 * scale = pixel size; letterSpacing/gap measured in font columns.
 */
function drawText(
  text: string,
  x: number,
  y: number,
  scale: number,
  color: RGB,
  shadow: RGB | null = null,
  shadowOffset = 0,
  columnGap = 1,
): number {
  let cursor = x;
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT[" "];
    const glyphW = 5;
    // Shadow pass then main pass per glyph keeps the offset inside each block
    for (const pass of shadow ? [1, 0] : [0]) {
      const c = pass === 1 ? shadow! : color;
      const dx = pass === 1 ? shadowOffset : 0;
      const dy = pass === 1 ? shadowOffset : 0;
      for (let row = 0; row < 7; row++) {
        const bits = glyph[row];
        for (let col = 0; col < glyphW; col++) {
          if (bits & (1 << (glyphW - 1 - col))) {
            rect(
              cursor + col * scale + dx,
              y + row * scale + dy,
              scale,
              scale,
              c,
            );
          }
        }
      }
    }
    cursor += (glyphW + columnGap) * scale;
  }
  return cursor - columnGap * scale;
}

function textWidth(text: string, scale: number, columnGap = 1): number {
  return text.length * (5 + columnGap) * scale - columnGap * scale;
}

// ---- Background: warm paper with the signature dot grid ----
rect(0, 0, W, H, PAPER);
for (let y = 10; y < H; y += 20) {
  for (let x = 10; x < W; x += 20) {
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) set(x + dx, y + dy, [214, 197, 172]);
  }
}

// ---- Logo mark (the four bars from the app icon), left side ----
const bars: { x: number; y: number; h: number; c: RGB }[] = [
  { x: 96, y: 250, h: 130, c: SUN },
  { x: 152, y: 190, h: 250, c: CARD },
  { x: 208, y: 276, h: 78, c: CORAL },
  { x: 264, y: 224, h: 182, c: MINT },
];
for (const b of bars) {
  rect(b.x + 10, b.y + 10, 44, b.h, INK); // hard offset shadow
  rect(b.x, b.y, 44, b.h, b.c);
  frame(b.x, b.y, 44, b.h, 4, INK);
}

// ---- Wordmark: "SHIFTEDTONE" with hard shadow, "TONE" flipped to coral ----
const wmY = 448;
drawText("SHIFTED", 88, wmY, 10, INK, null);
drawText("TONE", 88 + textWidth("SHIFTED ", 10), wmY, 10, CORAL, null);

// ---- Slogan under the wordmark (two lines) ----
drawText(
  "WHAT YOU MEANT.",
  90,
  wmY + 92,
  5,
  [109, 90, 72], // muted-foreground #6d5a48
);
drawText(
  "WHAT THEY HEARD.",
  90,
  wmY + 140,
  5,
  CORAL,
);

// ---- Headline chips (top right): tilted look via stepped rows ----
function chip(
  x: number,
  y: number,
  label: string,
  bg: RGB,
  scale: number,
  skewRows: number,
) {
  const padX = 14;
  const padY = 10;
  const w = textWidth(label, scale) + padX * 2;
  const h = 7 * scale + padY * 2;
  // shadow
  rect(x + 8, y + 8, w, h, INK);
  rect(x, y, w, h, bg);
  frame(x, y, w, h, 3, INK);
  drawText(label, x + padX, y + padY, scale, INK);
  // a hint of rotation: notch one corner
  for (let i = 0; i < skewRows; i++) {
    for (let xx = 0; xx < 3 * (skewRows - i); xx++) set(x + xx, y + i, bg);
  }
}

chip(560, 96, "CALM IS A SKILL", SUN, 6, 4);
chip(620, 210, "PAUSE IS POWER", MINT, 6, 3);
chip(500, 324, "REPLY, DON'T REACT", CORAL, 6, 5);

// ---- Top-left corner badge: "VOICE TONE GYM" ----
rect(88, 78, textWidth("THE VOICE TONE GYM", 5) + 28, 66, INK);
drawText("THE VOICE TONE GYM", 102, 92, 5, PAPER);

// ---- Bottom-right: equalizer accent ----
const eq = [40, 70, 55, 90, 45, 75, 60, 85, 50, 72];
let eqX = 1030;
for (let i = 0; i < eq.length; i++) {
  const h = Math.round((eq[i] / 100) * 120);
  rect(eqX + 4, 530 - h + 4, 10, h, INK);
  rect(eqX, 530 - h, 10, h, i % 3 === 0 ? CORAL : INK);
  eqX += 16;
}

// ---- PNG encoding ----
function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

const ihdr = new Uint8Array(13);
const dv = new DataView(ihdr.buffer);
dv.setUint32(0, W);
dv.setUint32(4, H);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor RGB
// stride = W*3 + filter byte
const stride = W * 3 + 1;
const raw = new Uint8Array(stride * H);
for (let y = 0; y < H; y++) {
  raw[y * stride] = 0; // filter: none
  raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * stride + 1);
}
const png = new Uint8Array(8);
png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const idat = deflateSync(raw, { level: 9 });
const parts = [
  png,
  chunk("IHDR", ihdr),
  chunk("IDAT", new Uint8Array(idat)),
  chunk("IEND", new Uint8Array(0)),
];
const total = parts.reduce((n, p) => n + p.length, 0);
const out = new Uint8Array(total);
let off = 0;
for (const p of parts) {
  out.set(p, off);
  off += p.length;
}
writeFileSync("public/og.png", out);
console.log(`Wrote public/og.png (${out.length} bytes)`);
