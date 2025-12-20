import { defineConfig, build } from 'vite';
import { resolve } from 'path';
import * as fs from 'fs';

// Custom plugin to build extension files
function buildExtension() {
  return {
    name: 'build-extension',
    async closeBundle() {
      // Copy manifest
      fs.copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );
      
      // Copy public folder
      const publicDir = resolve(__dirname, 'public');
      const distPublic = resolve(__dirname, 'dist/public');
      fs.cpSync(publicDir, distPublic, { recursive: true });
      
      // Copy popup HTML
      const popupHtml = fs.readFileSync(resolve(__dirname, 'src/popup/popup.html'), 'utf-8');
      const distPopupDir = resolve(__dirname, 'dist/popup');
      if (!fs.existsSync(distPopupDir)) {
        fs.mkdirSync(distPopupDir, { recursive: true });
      }
      // Update script reference
      const updatedHtml = popupHtml.replace('popup.ts', 'popup.js');
      fs.writeFileSync(resolve(distPopupDir, 'popup.html'), updatedHtml);
      
      // Update manifest with correct paths
      const manifest = JSON.parse(fs.readFileSync(resolve(__dirname, 'dist/manifest.json'), 'utf-8'));
      manifest.background.service_worker = 'background/service-worker.js';
      manifest.content_scripts[0].js = ['content/inject.js'];
      manifest.action.default_popup = 'popup/popup.html';
      fs.writeFileSync(
        resolve(__dirname, 'dist/manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
    },
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'content/inject': resolve(__dirname, 'src/content/inject.ts'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'popup/popup': resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
    target: 'esnext',
    minify: false, // Keep readable for debugging
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [buildExtension()],
});
