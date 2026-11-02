import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ mode }) => {
  return {
    // Use /JeeHandBook/ base path for GitHub Pages in production, / for local dev
    base: mode === 'production' ? '/JeeHandBook/' : '/',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'html-dev-transform',
        apply: 'serve',
        transformIndexHtml(html) {
          // In local development, always ensure /src/main.tsx is loaded with Vite HMR
          if (!html.includes('/src/main.tsx')) {
            html = html.replace(
              /<script type="module" crossorigin src=".*?"><\/script>/,
              '<script type="module" src="/src/main.tsx"></script>'
            );
          }
          return html;
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
