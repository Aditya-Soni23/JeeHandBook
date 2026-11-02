import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');
const assetsDir = path.join(rootDir, 'assets');

// 1. Create a safe, minimal 404.html that cleanly redirects without loop or extra asset requests
const safe404Html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>DIAMOND JEE HANDBOOK Store</title>
    <script>
      var path = window.location.pathname;
      if (!path.includes('#')) {
        window.location.replace('/JeeHandBook/');
      }
    </script>
  </head>
  <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #FAFAF8; color: #333;">
    <h3>Redirecting to DIAMOND JEE HANDBOOK Store...</h3>
    <p><a href="/JeeHandBook/">Click here if not redirected automatically</a></p>
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, '404.html'), safe404Html, 'utf8');

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

// 4b. Mirror dist/samples/ to root samples/ (for GitHub Pages root / support)
const distSamples = path.join(distDir, 'samples');
const rootSamples = path.join(rootDir, 'samples');
if (fs.existsSync(distSamples)) {
  if (!fs.existsSync(rootSamples)) {
    fs.mkdirSync(rootSamples, { recursive: true });
  }
  fs.cpSync(distSamples, rootSamples, { recursive: true });
}

// 4c. Mirror root static assets to repository root
for (const staticFile of ['logo.png', 'qr.jpeg', 'favicon.svg']) {
  const src = path.join(distDir, staticFile);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(rootDir, staticFile));
  }
}

// 5. Copy compiled production index.html to root for GitHub Pages root deployment
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, path.join(rootDir, 'index.html'));
}

// 6. Copy safe 404.html and .nojekyll to root
fs.writeFileSync(path.join(rootDir, '404.html'), safe404Html, 'utf8');
const noJekyll = path.join(distDir, '.nojekyll');
if (fs.existsSync(noJekyll)) {
  fs.copyFileSync(noJekyll, path.join(rootDir, '.nojekyll'));
}

console.log('[Postbuild] Safe GitHub Pages build created in dist/, docs/, and root.');
