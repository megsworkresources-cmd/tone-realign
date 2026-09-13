/** Validates public/og.png structure and prints an ASCII preview of the render. */
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const buf = readFileSync("public/og.png");

// Signature
const sig = Array.from(buf.subarray(0, 8))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join(" ");
console.log("signature ok:", sig === "89 50 4e 47 0d 0a 1a 0a");

// Walk chunks with CRC verification
let off = 8;
let idat: Uint8Array | null = null;
while (off < buf.length) {
  const dv = new DataView(buf.buffer, buf.byteOffset + off, 8);
  const len = dv.getUint32(0);
  const type = buf.subarray(off + 4, off + 8).toString("ascii");
  const payload = buf.subarray(off + 8, off + 8 + len);
  const storedCrc = new DataView(
    buf.buffer,
    buf.byteOffset + off + 8 + len,
    4,
  ).getUint32(0);
  // CRC over type + payload
  const crcBuf = buf.subarray(off + 4, off + 8 + len);
  let c = ~0;
  for (let i = 0; i < crcBuf.length; i++) {
    c ^= crcBuf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  const ok = (~c >>> 0) === storedCrc;
  console.log(`chunk ${type}: len=${len} crc=${ok ? "ok" : "FAIL"}`);
  if (type === "IHDR") {
    const d = new DataView(payload.buffer, payload.byteOffset, 13);
    console.log(
      `  ${d.getUint32(0)}x${d.getUint32(4)} depth=${payload[8]} colortype=${payload[9]}`,
    );
  }
  if (type === "IDAT") idat = new Uint8Array(inflateSync(payload));
  off += 12 + len;
}
console.log("walk complete:", off === buf.length);

if (!idat) {
  console.log("NO IDAT");
  process.exit(1);
}

// Decode raw scanlines and print a coarse ASCII preview (every 12th pixel)
const W = 1200;
const H = 630;
const stride = W * 3 + 1;
if (idat.length !== stride * H) {
  console.log(`unexpected raw size: ${idat.length} vs ${stride * H}`);
}
const sample = (x: number, y: number): string => {
  const i = y * stride + 1 + x * 3;
  const [r, g, b] = [idat![i], idat![i + 1], idat![i + 2]];
  if (r > 230 && g > 210 && b > 190) return "."; // paper/card
  if (r < 80 && g < 60 && b < 50) return "#"; // ink
  if (r > 200 && g > 140 && b < 110) return "S"; // sun
  if (g > 140 && r < 170 && b < 190) return "M"; // mint
  if (r > 190 && g < 160 && b < 140) return "C"; // coral
  return "o";
};
const lines: string[] = [];
for (let y = 0; y < H; y += 18) {
  let line = "";
  for (let x = 0; x < W; x += 12) line += sample(x, y);
  lines.push(line);
}
console.log(lines.join("\n"));
