const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  if (!fs.existsSync(filePath)) {
    return { error: 'File does not exist' };
  }
  const buffer = fs.readFileSync(filePath);
  // PNG signature is 8 bytes. IHDR chunk starts at byte 12. Width is at byte 16, height at byte 20 (both 4 bytes big endian)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const sizeKb = (buffer.length / 1024).toFixed(2);
  return { width, height, sizeKb };
}

const p1 = path.join(__dirname, '../public/logo-jtcell.png');
const p2 = path.join(__dirname, '../public/logo-jtcell-uploaded.png');

console.log('logo-jtcell.png:', getPngDimensions(p1));
console.log('logo-jtcell-uploaded.png:', getPngDimensions(p2));
