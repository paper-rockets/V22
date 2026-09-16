import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { defineConfig } from 'vite';
import { deletePresetsFromFiles } from './src/presets/presetRemover.js';

// TEMPORARY: receives device logs from src/utils/devErrorReporter.ts.
function devLogPlugin() {
  return {
    name: 'dev-log',
    configureServer(server: any) {
      server.middlewares.use('/__dev-log', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
          try {
            const { kind, message } = JSON.parse(body);
            const ua = String(req.headers['user-agent'] || '');
            const device = /Android/.test(ua) ? 'tablet' : 'pc';
            console.log(`[${device}] ${kind}: ${message}`);
          } catch (_) {}
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}

function presetApiPlugin() {
  return {
    name: 'preset-api-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/delete-presets' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const { ids } = JSON.parse(body);
              if (!Array.isArray(ids) || ids.length === 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'No preset IDs provided.' }));
                return;
              }
              const presetsDir = path.resolve(__dirname, 'src/presets');
              const result = deletePresetsFromFiles(presetsDir, ids);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, ...result }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const isHttps = process.env.HTTPS === 'true' || process.argv.includes('--https');

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      presetApiPlugin(),
      devLogPlugin(),
      ...(isHttps ? [basicSsl()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Keep the debug panel out of release/benchmark web assets entirely.
        '@debug-panel': path.resolve(
          __dirname,
          mode === 'debug'
            ? 'src/components/debug/DebugTestPanel.tsx'
            : 'src/components/debug/DebugTestPanel.release.tsx'
        ),
        // Keep the native debug bridge out of release/benchmark bundles too.
        '@debug-bridge': path.resolve(
          __dirname,
          mode === 'debug'
            ? 'src/core/debugBridge.debug.ts'
            : 'src/core/debugBridge.release.ts'
        ),
      },
    },
    define: {
      __IS_DEBUG_BUILD__: JSON.stringify(mode === 'debug'),
    },
    build: {
      // esbuild minification keeps builds fast; the parse win on mobile comes from
      // splitting, not from squeezing the last few percent out of the bytes.
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          shaders: path.resolve(__dirname, 'shaders.html'),
        },
        output: {
          /**
           * Vendor splitting.
           *
           * Three.js is by far the largest dependency and it changes only when the
           * package is upgraded. Keeping it in its own chunk means an app-code
           * deploy no longer invalidates it in the browser cache - which matters
           * most on a tablet over mobile data, where re-downloading and re-parsing
           * ~1 MB of engine code is the slowest part of a cold start.
           */
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('three-mesh-bvh')) return 'vendor-bvh';
            if (id.includes('/three/')) return 'vendor-three';
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('jszip')) return 'vendor-zip';
            if (id.includes('/motion/') || id.includes('framer-motion')) return 'vendor-motion';
            return undefined;
          },
        },
      },
    },
    clearScreen: false,
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      cors: true,
      allowedHosts: true,
      fs: {
        allow: ['..', '.'],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      cors: true,
      allowedHosts: true,
    },
  };
});
