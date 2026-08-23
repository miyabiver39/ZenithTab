import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function create24BitPNG(width, height, drawFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9); // RGB (24-bit, no alpha)
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = drawFn(x, y, width, height);
      const offset = 1 + x * 3;
      row[offset] = Math.min(255, Math.max(0, Math.round(r)));
      row[offset + 1] = Math.min(255, Math.max(0, Math.round(g)));
      row[offset + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);
  const idatData = zlib.deflateSync(rawData, { level: 6 });
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(len, 0);
  header.write(type, 4, 4, 'ascii');
  const typeAndData = Buffer.concat([header.subarray(4, 8), data]);
  const crc = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([header.subarray(0, 4), typeAndData, crcBuf]);
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function roundedRect(x, y, rx, ry, rw, rh, rad) {
  if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false;
  if (x < rx + rad && y < ry + rad) return dist(x, y, rx + rad, ry + rad) <= rad;
  if (x > rx + rw - rad && y < ry + rad) return dist(x, y, rx + rw - rad, ry + rad) <= rad;
  if (x < rx + rad && y > ry + rh - rad) return dist(x, y, rx + rad, ry + rh - rad) <= rad;
  if (x > rx + rw - rad && y > ry + rh - rad) return dist(x, y, rx + rw - rad, ry + rh - rad) <= rad;
  return true;
}

// 1. Small Promo Tile (440x280)
function drawSmallPromo(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  // Deep dark cyan-indigo gradient
  let r = 10 + 20 * Math.sin(nx * 3.14);
  let g = 18 + 35 * Math.sin((nx + ny) * 2.0);
  let b = 45 + 75 * Math.sin(nx * 2.5);

  // Radial highlight
  const dCenter = dist(x, y, w * 0.5, h * 0.35);
  if (dCenter < 200) {
    const factor = (1 - dCenter / 200) * 0.45;
    r += 14 * factor;
    g += 165 * factor;
    b += 233 * factor;
  }

  // Centered App Icon (w: 64, h: 64 at y: 55)
  const iconX = w / 2 - 32;
  const iconY = 55;
  if (roundedRect(x, y, iconX, iconY, 64, 64, 18)) {
    // Gradient inside icon
    return [14, 165, 233];
  }
  // 'Z' letter inside icon
  if (x >= iconX + 16 && x <= iconX + 48 && y >= iconY + 16 && y <= iconY + 48) {
    // Top bar
    if (y <= iconY + 22) return [255, 255, 255];
    // Bottom bar
    if (y >= iconY + 42) return [255, 255, 255];
    // Diagonal
    const diagX = iconX + 48 - (y - (iconY + 16));
    if (Math.abs(x - diagX) <= 4) return [255, 255, 255];
  }

  // Decorative glass badge (y 145..190)
  if (roundedRect(x, y, 60, 145, 320, 48, 14)) {
    return [30, 41, 59];
  }

  // Subtitle pill (y 210..240)
  if (roundedRect(x, y, 90, 210, 260, 32, 10)) {
    return [15, 23, 42];
  }

  return [r, g, b];
}

// 2. Marquee Promo Tile (1400x560)
function drawMarqueePromo(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  let r = 8 + 25 * Math.sin(nx * 3.14) + 10 * Math.cos(ny * 2.0);
  let g = 14 + 40 * Math.sin((nx + ny) * 2.2);
  let b = 38 + 90 * Math.sin(nx * 2.8);

  // Left-side branding glow
  const dBrand = dist(x, y, 320, 280);
  if (dBrand < 350) {
    const factor = (1 - dBrand / 350) * 0.4;
    r += 14 * factor;
    g += 165 * factor;
    b += 233 * factor;
  }

  // Left: App Icon (100x100 at x 120, y 180)
  if (roundedRect(x, y, 120, 180, 100, 100, 26)) {
    return [14, 165, 233];
  }
  // 'Z' letter inside icon
  if (x >= 145 && x <= 195 && y >= 205 && y <= 255) {
    if (y <= 215) return [255, 255, 255];
    if (y >= 245) return [255, 255, 255];
    const diagX = 195 - (y - 205);
    if (Math.abs(x - diagX) <= 6) return [255, 255, 255];
  }

  // Left: Title Glass Banner (x 250, y 180, w 340, h 60)
  if (roundedRect(x, y, 250, 180, 340, 60, 16)) {
    return [30, 41, 59];
  }

  // Left: Subtitle Glass Banner (x 250, y 255, w 300, h 36)
  if (roundedRect(x, y, 250, 255, 300, 36, 10)) {
    return [15, 23, 42];
  }

  // Left: Feature Tags (3 pills at y 340)
  if (roundedRect(x, y, 120, 340, 130, 38, 12) || roundedRect(x, y, 265, 340, 140, 38, 12) || roundedRect(x, y, 420, 340, 140, 38, 12)) {
    return [30, 41, 59];
  }

  // Right Side: Floating Dashboard Mockup (x 680..1320, y 70..490)
  if (roundedRect(x, y, 680, 70, 640, 420, 24)) {
    // Dashboard window background
    let mr = 15, mg = 23, mb = 42;
    // Header
    if (y >= 70 && y <= 120) {
      mr = 30; mg = 41; mb = 59;
    }
    // Search bar (x 720..1280, y 135..175)
    if (roundedRect(x, y, 740, 135, 520, 40, 14)) {
      return [30, 41, 59];
    }
    // Mini Widget 1 (Clock)
    if (roundedRect(x, y, 740, 195, 245, 125, 14)) {
      return [30, 41, 59];
    }
    // Mini Widget 2 (Weather)
    if (roundedRect(x, y, 1015, 195, 245, 125, 14)) {
      return [30, 41, 59];
    }
    // Mini Widget 3 (Shortcuts)
    if (roundedRect(x, y, 740, 335, 520, 130, 14)) {
      return [30, 41, 59];
    }
    return [mr, mg, mb];
  }

  return [r, g, b];
}

// Generate files into target dirs
const targetDirs = [
  'C:/Users/miyab/git/ZenthTab/store-assets',
  'C:/Users/miyab/git/zenith-tab/store-assets',
];

targetDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Copy user screenshots into store-assets
  const srcScreenshots = [
    'screenshot1.png',
    'screenshot2.png',
    'screenshot3.png',
    'screenshot4.png',
  ];
  srcScreenshots.forEach((f, idx) => {
    const srcPath = path.join('C:/Users/miyab/git/ZenthTab', f);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(dir, `screenshot_${idx + 1}_1280x800.png`));
    }
  });

  // 2. Generate Small Promo (440x280)
  const smallPromo = create24BitPNG(440, 280, drawSmallPromo);
  fs.writeFileSync(path.join(dir, 'promo_tile_small_440x280.png'), smallPromo);

  // 3. Generate Marquee Promo (1400x560)
  const marqueePromo = create24BitPNG(1400, 560, drawMarqueePromo);
  fs.writeFileSync(path.join(dir, 'marquee_promo_tile_1400x560.png'), marqueePromo);

  // 4. Shop icon
  const iconPath = path.join('C:/Users/miyab/git/ZenthTab/public/icons/icon128.png');
  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, path.join(dir, 'shop_icon_128x128.png'));
  }

  console.log(`Generated all store assets in: ${dir}`);
});
