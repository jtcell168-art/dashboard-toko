const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\c97f4a44-7707-459d-a1fc-b9f5139f2d5c';
const destDir = 'd:\\Dashboard-Toko-Ai\\public';

const files = [
  { src: 'media__1779116202591.png', dest: 'logo-jtcell-uploaded.png' },
  { src: 'media__1779116237371.png', dest: 'peta-flores.png' }
];

files.forEach(f => {
  const srcPath = path.join(srcDir, f.src);
  const destPath = path.join(destDir, f.dest);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${f.src} to ${f.dest} successfully!`);
  } else {
    console.error(`Source file ${srcPath} does not exist.`);
  }
});
