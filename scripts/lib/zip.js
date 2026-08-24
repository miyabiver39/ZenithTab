import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * A tiny, dependency-free ZIP writer.
 *
 * The previous packaging step shelled out to the `zip` binary, which does not
 * exist on a stock Windows install — so `npm run package` only worked on
 * macOS/Linux. Everything here is plain Node, so packaging behaves identically
 * on every machine and in CI.
 *
 * Scope is deliberately minimal: stored/deflated entries, UTF-8 names, no
 * ZIP64. A Chrome extension bundle is far below every limit that would require
 * more.
 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0 ^ -1;
  for (let i = 0; i < buffer.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buffer[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

/** ZIP stores timestamps in the old MS-DOS packed format. */
function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/** Recursively lists files under `dir`, including dotfiles, as POSIX-style relative paths. */
export function listFilesRecursive(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }

  return files.sort();
}

/**
 * Writes every file under `sourceDir` into a ZIP archive at `outputPath`.
 * Returns the list of archived entry names.
 */
export function zipDirectory(sourceDir, outputPath) {
  const names = listFilesRecursive(sourceDir);
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const name of names) {
    const absolute = path.join(sourceDir, name);
    const contents = fs.readFileSync(absolute);
    const stat = fs.statSync(absolute);
    const { time, date } = dosDateTime(stat.mtime);

    const deflated = zlib.deflateRawSync(contents, { level: 9 });
    // Only compress when it actually helps; tiny or pre-compressed files
    // (PNG, JPEG) often grow under deflate.
    const useDeflate = deflated.length < contents.length;
    const payload = useDeflate ? deflated : contents;
    const method = useDeflate ? 8 : 0;

    const nameBuffer = Buffer.from(name, 'utf8');
    const checksum = crc32(contents);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(contents.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length

    localChunks.push(localHeader, nameBuffer, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(contents.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra
    centralHeader.writeUInt16LE(0, 32); // comment
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attributes
    centralHeader.writeUInt32LE(0o644 << 16, 38); // external attributes
    centralHeader.writeUInt32LE(offset, 42);

    centralChunks.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + payload.length;
  }

  const central = Buffer.concat(centralChunks);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4); // this disk
  endRecord.writeUInt16LE(0, 6); // disk with central directory
  endRecord.writeUInt16LE(names.length, 8);
  endRecord.writeUInt16LE(names.length, 10);
  endRecord.writeUInt32LE(central.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20); // comment length

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.concat([...localChunks, central, endRecord]));

  return names;
}
