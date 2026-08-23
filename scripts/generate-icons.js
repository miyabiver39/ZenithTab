import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createZenithIconPNG(size) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // Generate RGBA pixel data
  const rawRows = [];
  const radius = width / 2;
  const center = width / 2;
  
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter byte: None
    
    for (let x = 0; x < width; x++) {
      const offset = 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius - 1) {
        const t = (x + y) / (width + height);
        let r = Math.round(14 * (1 - t) + 14 * t);
        let g = Math.round(165 * (1 - t) + 189 * t);
        let b = Math.round(233 * (1 - t) + 248 * t);
        let a = 255;
        
        if (dist > radius - 2) {
          a = Math.round(255 * (radius - 1 - dist + 1));
        }
        
        // Stylized "Z"
        const nx = x / width;
        const ny = y / height;
        const inZ = (
          (ny >= 0.28 && ny <= 0.36 && nx >= 0.28 && nx <= 0.72) ||
          (ny >= 0.64 && ny <= 0.72 && nx >= 0.28 && nx <= 0.72) ||
          (Math.abs((1 - nx) - ny) < 0.08 && nx >= 0.28 && nx <= 0.72 && ny >= 0.28 && ny <= 0.72)
        );
        
        if (inZ) {
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        }
        
        row[offset] = r;
        row[offset + 1] = g;
        row[offset + 2] = b;
        row[offset + 3] = a;
      } else {
        row[offset] = 0;
        row[offset + 1] = 0;
        row[offset + 2] = 0;
        row[offset + 3] = 0;
      }
    }
    rawRows.push(row);
  }
  
  const rawData = Buffer.concat(rawRows);
  const idatData = zlib.deflateSync(rawData);
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

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuffer = createZenithIconPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuffer);
  console.log(`Generated icon${size}.png`);
});

const wallDir = path.resolve('public/default-wallpapers');
if (!fs.existsSync(wallDir)) {
  fs.mkdirSync(wallDir, { recursive: true });
}
