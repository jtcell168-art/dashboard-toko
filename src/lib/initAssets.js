import fs from 'fs';
import path from 'path';

export function initPremiumAssets() {
  try {
    const srcDir = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\c97f4a44-7707-459d-a1fc-b9f5139f2d5c';
    const activeConvoDir = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\0163dbad-2389-4f1e-9224-da534b3304b6';
    const destDir = path.join(process.cwd(), 'public');

    // Make sure public directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // List of files to copy
    const files = [
      { src: 'media__1779118957919.png', dest: 'peta-flores.png', dir: srcDir }
    ];

    // Check if premium logo exists in current conversation dir and map it to all relevant icon and logo destinations
    const premiumLogoSrc = 'logo_jtcell_premium_1779284084835.png';
    const premiumLogoSrcPath = path.join(activeConvoDir, premiumLogoSrc);

    if (fs.existsSync(premiumLogoSrcPath)) {
      const premiumDestinations = [
        'logo-jtcell-uploaded.png',
        'logo-jtcell.png',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png'
      ];
      premiumDestinations.forEach(dest => {
        files.push({ src: premiumLogoSrc, dest: dest, dir: activeConvoDir });
      });
    } else {
      // Fallback to old logo if premium logo doesn't exist
      files.push({ src: 'media__1779116202591.png', dest: 'logo-jtcell-uploaded.png', dir: srcDir });
      files.push({ src: 'media__1779116202591.png', dest: 'logo-jtcell.png', dir: srcDir });
    }

    files.forEach(f => {
      const srcPath = path.join(f.dir, f.src);
      const destPath = path.join(destDir, f.dest);
      
      // Only copy if size is different or file doesn't exist, to avoid unnecessary writes
      let shouldCopy = false;
      if (!fs.existsSync(destPath)) {
        shouldCopy = true;
      } else {
        const srcStat = fs.statSync(srcPath);
        const destStat = fs.statSync(destPath);
        if (srcStat.size !== destStat.size) {
          shouldCopy = true;
        }
      }

      if (shouldCopy && fs.existsSync(srcPath)) {
        if (fs.existsSync(destPath)) {
          try {
            fs.unlinkSync(destPath);
          } catch (e) {
            // ignore
          }
        }
        fs.copyFileSync(srcPath, destPath);
        console.log(`[Asset Init] Copied ${f.src} to ${f.dest}`);
      }
    });
  } catch (err) {
    console.error('[Asset Init] Error copying assets:', err);
  }
}
