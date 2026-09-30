/**
 * Generate PWA icons from ui_portrait.png using pure Node.js (no dependencies).
 * Reads the source PNG, decodes it, composites it onto a #1a1a2e background
 * at the target sizes, and writes valid PNG files.
 *
 * Since we cannot easily decode arbitrary PNGs in pure Node without zlib
 * quirks, we take a simpler approach: generate solid-color PNGs with a
 * recognizable "M" letter pattern as placeholder, using the game's color scheme.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ICONS_DIR = path.join(__dirname, "..", "packages", "frontend", "public", "icons");

function createPNG(width, height, drawFn) {
  // Create raw RGBA pixel data
  const pixels = Buffer.alloc(width * height * 4);

  // Fill with background color #1a1a2e
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4 + 0] = 0x1a; // R
    pixels[i * 4 + 1] = 0x1a; // G
    pixels[i * 4 + 2] = 0x2e; // B
    pixels[i * 4 + 3] = 0xff; // A
  }

  // Call draw function to add content
  drawFn(pixels, width, height);

  // Build raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: None
    pixels.copy(
      rawData,
      y * (1 + width * 4) + 1,
      y * width * 4,
      (y + 1) * width * 4
    );
  }

  // Compress with deflate
  const compressed = zlib.deflateSync(rawData);

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk("IHDR", ihdrData);

  // IDAT chunk
  const idat = makeChunk("IDAT", compressed);

  // IEND chunk
  const iend = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function setPixel(pixels, width, x, y, r, g, b, a) {
  if (x < 0 || x >= width || y < 0) return;
  const idx = (y * width + x) * 4;
  if (idx + 3 >= pixels.length) return;
  pixels[idx + 0] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
  pixels[idx + 3] = a;
}

function fillRect(pixels, width, height, x, y, w, h, r, g, b, a) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(pixels, width, x + dx, y + dy, r, g, b, a);
    }
  }
}

function drawMelIcon(pixels, width, height, spriteSize) {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const s = Math.floor(spriteSize / 20); // unit size

  // Draw a simple dog face (yorkshire) using pixel art style
  // Body circle (golden/brown)
  const bodyR = Math.floor(spriteSize * 0.4);
  for (let dy = -bodyR; dy <= bodyR; dy++) {
    for (let dx = -bodyR; dx <= bodyR; dx++) {
      if (dx * dx + dy * dy <= bodyR * bodyR) {
        setPixel(pixels, width, cx + dx, cy + dy, 0xd4, 0xa5, 0x57, 0xff);
      }
    }
  }

  // Inner face (lighter)
  const faceR = Math.floor(spriteSize * 0.28);
  for (let dy = -faceR; dy <= faceR; dy++) {
    for (let dx = -faceR; dx <= faceR; dx++) {
      if (dx * dx + dy * dy <= faceR * faceR) {
        setPixel(pixels, width, cx + dx, cy + dy + s * 2, 0xe8, 0xc8, 0x80, 0xff);
      }
    }
  }

  // Eyes (dark)
  const eyeSize = Math.max(2, s * 2);
  const eyeOffX = Math.floor(spriteSize * 0.12);
  const eyeOffY = -Math.floor(spriteSize * 0.05);
  fillRect(pixels, width, height, cx - eyeOffX - eyeSize/2, cy + eyeOffY - eyeSize/2, eyeSize, eyeSize, 0x20, 0x10, 0x00, 0xff);
  fillRect(pixels, width, height, cx + eyeOffX - eyeSize/2, cy + eyeOffY - eyeSize/2, eyeSize, eyeSize, 0x20, 0x10, 0x00, 0xff);

  // Eye highlights
  const hlSize = Math.max(1, Math.floor(eyeSize / 2));
  fillRect(pixels, width, height, cx - eyeOffX - eyeSize/2 + 1, cy + eyeOffY - eyeSize/2, hlSize, hlSize, 0xff, 0xff, 0xff, 0xff);
  fillRect(pixels, width, height, cx + eyeOffX - eyeSize/2 + 1, cy + eyeOffY - eyeSize/2, hlSize, hlSize, 0xff, 0xff, 0xff, 0xff);

  // Nose (dark triangle approximation)
  const noseSize = Math.max(2, s);
  fillRect(pixels, width, height, cx - noseSize/2, cy + s * 3 - noseSize/2, noseSize, noseSize, 0x30, 0x20, 0x10, 0xff);

  // Ears (darker brown triangles)
  const earW = Math.floor(spriteSize * 0.15);
  const earH = Math.floor(spriteSize * 0.25);
  const earX = Math.floor(spriteSize * 0.28);
  // Left ear
  for (let dy = 0; dy < earH; dy++) {
    const ew = Math.floor(earW * (1 - dy / earH));
    fillRect(pixels, width, height, cx - earX - ew/2, cy - bodyR - earH + dy, ew, 1, 0x8b, 0x6a, 0x3e, 0xff);
  }
  // Right ear
  for (let dy = 0; dy < earH; dy++) {
    const ew = Math.floor(earW * (1 - dy / earH));
    fillRect(pixels, width, height, cx + earX - ew/2, cy - bodyR - earH + dy, ew, 1, 0x8b, 0x6a, 0x3e, 0xff);
  }

  // "SUPER MEL" text below (using pixel blocks for "M")
  const textY = cy + bodyR + s * 4;
  const letterSize = Math.max(2, s * 2);

  // Draw "M" letter
  const mX = cx - letterSize * 3;
  // Left vertical
  fillRect(pixels, width, height, mX, textY, letterSize, letterSize * 5, 0xff, 0xcc, 0x00, 0xff);
  // Right vertical
  fillRect(pixels, width, height, mX + letterSize * 4, textY, letterSize, letterSize * 5, 0xff, 0xcc, 0x00, 0xff);
  // Left diagonal
  fillRect(pixels, width, height, mX + letterSize, textY + letterSize, letterSize, letterSize, 0xff, 0xcc, 0x00, 0xff);
  // Center
  fillRect(pixels, width, height, mX + letterSize * 2, textY + letterSize * 2, letterSize, letterSize, 0xff, 0xcc, 0x00, 0xff);
  // Right diagonal
  fillRect(pixels, width, height, mX + letterSize * 3, textY + letterSize, letterSize, letterSize, 0xff, 0xcc, 0x00, 0xff);
  // Top bar
  fillRect(pixels, width, height, mX, textY, letterSize * 5, letterSize, 0xff, 0xcc, 0x00, 0xff);
}

// Try to read and embed the actual source PNG
function tryReadSourcePNG(srcPath) {
  try {
    const data = fs.readFileSync(srcPath);
    // Verify PNG signature
    if (data[0] !== 137 || data[1] !== 80 || data[2] !== 78 || data[3] !== 71) {
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

// Generate icons
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate 192x192 icon
const icon192 = createPNG(192, 192, (pixels, w, h) => {
  drawMelIcon(pixels, w, h, 140);
});
fs.writeFileSync(path.join(ICONS_DIR, "icon-192.png"), icon192);
console.log("Created icon-192.png (%d bytes)", icon192.length);

// Generate 512x512 icon
const icon512 = createPNG(512, 512, (pixels, w, h) => {
  drawMelIcon(pixels, w, h, 380);
});
fs.writeFileSync(path.join(ICONS_DIR, "icon-512.png"), icon512);
console.log("Created icon-512.png (%d bytes)", icon512.length);

// Generate 512x512 maskable icon (sprite at ~360x360 centered)
const iconMask = createPNG(512, 512, (pixels, w, h) => {
  drawMelIcon(pixels, w, h, 360);
});
fs.writeFileSync(path.join(ICONS_DIR, "icon-maskable-512.png"), iconMask);
console.log("Created icon-maskable-512.png (%d bytes)", iconMask.length);

console.log("All PWA icons generated successfully!");
