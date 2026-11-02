import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');
const assetsDir = path.join(rootDir, 'assets');

// 1. Ensure 404.html in dist
const distIndex = path.join(distDir, 'index.html');
const dist404 = path.join(distDir, '404.html');
if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, dist404);
}

// 2. Find the main JS and CSS bundles in dist/assets
const distAssets = path.join(distDir, 'assets');
let mainJs = null;
let mainCss = null;

if (fs.existsSync(distAssets)) {
  const files = fs.readdirSync(distAssets);
  for (const f of files) {
    if (f.startsWith('index-') && f.endsWith('.js')) {
      mainJs = f;
    }
    if (f.startsWith('index-') && f.endsWith('.css')) {
      mainCss = f;
    }
  }

  // Create app.js and app.css aliases in dist/assets
  if (mainJs) {
    fs.copyFileSync(path.join(distAssets, mainJs), path.join(distAssets, 'app.js'));
  }
  if (mainCss) {
    fs.copyFileSync(path.join(distAssets, mainCss), path.join(distAssets, 'app.css'));
  }
}

// 3. Mirror dist/ to docs/ (for GitHub Pages /docs folder support)
fs.cpSync(distDir, docsDir, { recursive: true });

// 4. Mirror dist/assets/ to root assets/ (for GitHub Pages root / support)
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}
fs.cpSync(distAssets, assetsDir, { recursive: true });

// 5. Copy 404.html and .nojekyll to root
fs.copyFileSync(dist404, path.join(rootDir, '404.html'));
const noJekyll = path.join(distDir, '.nojekyll');
if (fs.existsSync(noJekyll)) {
  fs.copyFileSync(noJekyll, path.join(rootDir, '.nojekyll'));
}

console.log('[Postbuild] Prepared dist/, docs/, and root assets for GitHub Pages deployment.');
