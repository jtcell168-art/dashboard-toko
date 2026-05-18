import { getOnlineProducts } from "./actions/store";
import StoreFrontClient from "@/components/store/StoreFrontClient";
import fs from 'fs';
import path from 'path';

// REVALIDATE TO UPDATE STORE
export const revalidate = 0; 

export default async function StoreFront() {
  const products = await getOnlineProducts();

  // Dynamically copy user uploaded media assets to public folder on server run
  try {
    const srcDir = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\c97f4a44-7707-459d-a1fc-b9f5139f2d5c';
    const destDir = path.join(process.cwd(), 'public');

    const files = [
      { src: 'media__1779116202591.png', dest: 'logo-jtcell-uploaded.png' },
      { src: 'media__1779118957919.png', dest: 'peta-flores.png' }
    ];

    files.forEach(f => {
      const srcPath = path.join(srcDir, f.src);
      const destPath = path.join(destDir, f.dest);
      if (fs.existsSync(destPath)) {
        try {
          fs.unlinkSync(destPath);
        } catch (e) {
          console.log('Skipping unlink:', e.message);
        }
      }
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  } catch (err) {
    console.error('Error copying assets:', err);
  }

  return <StoreFrontClient products={products} />;
}
