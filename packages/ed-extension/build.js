// Build script for Ed Extension
// Content scripts need IIFE format, background needs ES module

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  console.log('Building Ed Extension...');
  
  // Ensure Ed widget is built first
  console.log('  Building Ed widget...');
  const widgetDir = path.resolve(__dirname, '../ed-widget');
  if (fs.existsSync(widgetDir)) {
    const { execSync } = await import('child_process');
    try {
      execSync('npm run build', { 
        cwd: widgetDir, 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      console.log('    ✓ Ed widget built');
    } catch (error) {
      console.warn('    ⚠ Failed to build Ed widget, continuing anyway...');
    }
  }
  
  // Clean dist (handle file locks gracefully)
  const distDir = path.resolve(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    try {
      fs.rmSync(distDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('  ⚠️ Could not fully clean dist (files may be locked by Chrome)');
      console.warn('  Continuing anyway...');
    }
  }
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Build content script (IIFE - no imports)
  console.log('  Building content script...');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/content/inject.ts')],
    bundle: true,
    outfile: path.resolve(distDir, 'content/inject.js'),
    format: 'iife',
    target: 'chrome100',
    minify: false,
    sourcemap: false,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  });
  
  // Build page context injection script (IIFE - standalone, no chrome APIs)
  console.log('  Building page context injection script...');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/content/inject-page.ts')],
    bundle: true,
    outfile: path.resolve(distDir, 'content/inject-page.js'),
    format: 'iife',
    target: 'chrome100',
    minify: false,
    sourcemap: false,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    // Don't bundle chrome APIs - they're not available in page context
    external: ['chrome'],
    banner: {
      js: '// Page Context Script - Runs in page\'s JavaScript context, not content script context',
    },
  });
  
  // Build background service worker (ES module)
  console.log('  Building background service worker...');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/background/service-worker.ts')],
    bundle: true,
    outfile: path.resolve(distDir, 'background/service-worker.js'),
    format: 'esm',
    target: 'chrome100',
    minify: false,
    sourcemap: false,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  });
  
  // Build popup script
  console.log('  Building popup...');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'src/popup/popup.ts')],
    bundle: true,
    outfile: path.resolve(distDir, 'popup/popup.js'),
    format: 'iife',
    target: 'chrome100',
    minify: false,
    sourcemap: false,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  });
  
  // Copy and update popup HTML
  console.log('  Copying popup HTML...');
  let popupHtml = fs.readFileSync(
    path.resolve(__dirname, 'src/popup/popup.html'),
    'utf-8'
  );
  // No need to replace popup.ts since it's already popup.js in the HTML
  fs.writeFileSync(path.resolve(distDir, 'popup/popup.html'), popupHtml);
  
  // Copy public folder
  console.log('  Copying public assets...');
  fs.cpSync(
    path.resolve(__dirname, 'public'),
    path.resolve(distDir, 'public'),
    { recursive: true }
  );
  
  // Copy Ed widget bundle (if it exists)
  console.log('  Copying Ed widget bundle...');
  const widgetDist = path.resolve(__dirname, '../ed-widget/dist');
  if (fs.existsSync(widgetDist)) {
    const widgetTarget = path.resolve(distDir, 'ed-widget');
    fs.mkdirSync(widgetTarget, { recursive: true });
    
    // Copy IIFE bundle
    const widgetBundle = path.resolve(widgetDist, 'ed-widget.iife.js');
    if (fs.existsSync(widgetBundle)) {
      fs.copyFileSync(widgetBundle, path.resolve(widgetTarget, 'ed-widget.iife.js'));
      const stats = fs.statSync(path.resolve(widgetTarget, 'ed-widget.iife.js'));
      console.log(`    ✓ Copied ed-widget.iife.js (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.error('    ❌ ed-widget.iife.js not found in', widgetDist);
    }
    
    // Copy CSS
    const widgetCss = path.resolve(widgetDist, 'ed-widget.css');
    if (fs.existsSync(widgetCss)) {
      fs.copyFileSync(widgetCss, path.resolve(widgetTarget, 'ed-widget.css'));
      const stats = fs.statSync(path.resolve(widgetTarget, 'ed-widget.css'));
      console.log(`    ✓ Copied ed-widget.css (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.error('    ❌ ed-widget.css not found in', widgetDist);
    }
    
    // Verify files exist
    const bundleExists = fs.existsSync(path.resolve(widgetTarget, 'ed-widget.iife.js'));
    const cssExists = fs.existsSync(path.resolve(widgetTarget, 'ed-widget.css'));
    if (!bundleExists || !cssExists) {
      console.error('    ❌ Widget bundle files missing!');
      console.error('    Run: cd packages/ed-widget && npm run build');
    }
  } else {
    console.error('    ❌ Ed widget dist not found:', widgetDist);
    console.error('    Run: cd packages/ed-widget && npm run build');
  }
  
  // Copy and update manifest
  console.log('  Updating manifest...');
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'manifest.json'), 'utf-8')
  );
  manifest.background.service_worker = 'background/service-worker.js';
  manifest.content_scripts[0].js = ['content/inject.js'];
  manifest.action.default_popup = 'popup/popup.html';
  
  // Add page injection script to web_accessible_resources
  if (!manifest.web_accessible_resources) {
    manifest.web_accessible_resources = [];
  }
  const warEntry = manifest.web_accessible_resources.find((entry) => 
    entry.resources && Array.isArray(entry.resources)
  );
  if (warEntry) {
    if (!warEntry.resources.includes('content/inject-page.js')) {
      warEntry.resources.push('content/inject-page.js');
    }
  } else {
    manifest.web_accessible_resources.push({
      resources: ['content/inject-page.js'],
      matches: ['<all_urls>']
    });
  }
  
  fs.writeFileSync(
    path.resolve(distDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('Build complete!');
  console.log(`Output: ${distDir}`);
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

