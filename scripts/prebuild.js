import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const indexHtmlPath = path.join(rootDir, 'index.html');

let content = fs.readFileSync(indexHtmlPath, 'utf8');

// Ensure /src/main.tsx is the entry script before building
if (!content.includes('/src/main.tsx')) {
  content = content.replace(
    /<script type="module" crossorigin src=".*?"><\/script>/,
    '<script type="module" src="/src/main.tsx"></script>'
  );
  // Also remove production CSS link if present
  content = content.replace(
    /<link rel="stylesheet" crossorigin href=".*?">/,
    ''
  );
  fs.writeFileSync(indexHtmlPath, content, 'utf8');
  console.log('[Prebuild] Reset index.html to source entry /src/main.tsx');
}
