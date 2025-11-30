import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: isLib
      ? {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'EdWidget',
            fileName: 'ed-widget',
            formats: ['iife'],
          },
          rollupOptions: {
            output: {
              assetFileNames: 'ed-widget.[ext]',
            },
          },
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }
      : {
          outDir: 'dist',
        },
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api/fish-audio': {
          target: 'https://api.fish.audio',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/fish-audio/, '/v1'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Forward authorization header from request
              const authHeader = req.headers['authorization'];
              if (authHeader) {
                proxyReq.setHeader('Authorization', authHeader);
                console.log('[Vite Proxy] Forwarding Authorization header to Fish Audio API');
              } else {
                console.warn('[Vite Proxy] ⚠️ No Authorization header found in request');
              }
              
              // Ensure Content-Type is set
              if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
              }
            });
            
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('[Vite Proxy] Response from Fish Audio:', {
                status: proxyRes.statusCode,
                statusText: proxyRes.statusMessage,
                headers: proxyRes.headers,
              });
            });
          },
        },
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
  };
});

