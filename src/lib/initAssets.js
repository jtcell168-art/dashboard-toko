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

    // Check if perfect original glow premium logo exists, fallback to solid black, solid circle, circular, clean cropped, uncropped premium, then to old logo
    const perfectGlowLogoSrc = 'logo_jtcell_perfect_glow_1779285547865.png';
    const solidBlackBgLogoSrc = 'logo_jtcell_solid_black_bg_1779285382702.png';
    const solidCircleLogoSrc = 'logo_jtcell_solid_circle_1779285276155.png';
    const circleLogoSrc = 'logo_jtcell_circle_1779285037010.png';
    const cleanLogoSrc = 'logo_jtcell_clean_1779284818300.png';
    const premiumLogoSrc = 'logo_jtcell_premium_1779284084835.png';
    
    const perfectGlowLogoPath = path.join(activeConvoDir, perfectGlowLogoSrc);
    const solidBlackBgLogoPath = path.join(activeConvoDir, solidBlackBgLogoSrc);
    const solidCircleLogoPath = path.join(activeConvoDir, solidCircleLogoSrc);
    const circleLogoPath = path.join(activeConvoDir, circleLogoSrc);
    const cleanLogoPath = path.join(activeConvoDir, cleanLogoSrc);
    const premiumLogoSrcPath = path.join(activeConvoDir, premiumLogoSrc);

    const premiumDestinations = [
      'logo-jtcell-uploaded.png',
      'logo-jtcell.png',
      'icon-192.png',
      'icon-512.png',
      'apple-touch-icon.png'
    ];

    if (fs.existsSync(perfectGlowLogoPath)) {
      console.log('Perfect original glow premium logo found, configuring high-resolution assets...');
      premiumDestinations.forEach(dest => {
        files.push({ src: perfectGlowLogoSrc, dest: dest, dir: activeConvoDir });
      });
    } else if (fs.existsSync(solidBlackBgLogoPath)) {
      console.log('Solid black background circular premium logo found, configuring high-resolution assets...');
      premiumDestinations.forEach(dest => {
        files.push({ src: solidBlackBgLogoSrc, dest: dest, dir: activeConvoDir });
      });
    } else if (fs.existsSync(solidCircleLogoPath)) {
      console.log('Solid circular premium logo found, configuring high-resolution assets...');
      premiumDestinations.forEach(dest => {
        files.push({ src: solidCircleLogoSrc, dest: dest, dir: activeConvoDir });
      });
    } else if (fs.existsSync(circleLogoPath)) {
      console.log('Circular premium logo found, configuring high-resolution assets...');
      premiumDestinations.forEach(dest => {
        files.push({ src: circleLogoSrc, dest: dest, dir: activeConvoDir });
      });
    } else if (fs.existsSync(cleanLogoPath)) {
      console.log('Clean cropped premium logo found, configuring high-resolution transparent assets...');
      premiumDestinations.forEach(dest => {
        files.push({ src: cleanLogoSrc, dest: dest, dir: activeConvoDir });
      });
    } else if (fs.existsSync(premiumLogoSrcPath)) {
      console.log('Fallback: Uncropped premium logo found, configuring assets...');
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
