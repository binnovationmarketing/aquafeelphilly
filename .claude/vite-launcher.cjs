/**
 * Vite dev server launcher (CJS) for Claude Code preview sandbox.
 *
 * Why this file exists:
 *   1. The sandbox's initial cwd is inaccessible → process.cwd() throws EPERM.
 *      Fixed by /tmp/patch_cwd.js (loaded via --require before this file).
 *   2. Running vite's ESM bin directly fails when loading vite.config.ts because
 *      the ESM loader gets '.' as __dirname from the broken initial cwd.
 *      Fixed by passing the config inline here (no disk config load needed).
 *   3. The rollup native darwin-x64 addon (built for macOS 15 SDK) crashes on
 *      macOS 12. Fixed by the patched rollup/dist/native.js in node_modules.
 */

'use strict';

const PROJECT = '/Users/rique_energy/Documents/Negocios/Aquafeel Solutions Philly/Desenvolvimento/Aquafeel Vip Proposal';

process.on('uncaughtException', (e) => {
  console.error('[launcher] uncaughtException:', e.message);
  process.exit(1);
});
process.on('unhandledRejection', (r) => {
  console.error('[launcher] unhandledRejection:', String(r));
  process.exit(1);
});

// Use dynamic import() to load ESM plugins from a known __dirname
async function main() {
  const [{ default: react }, { VitePWA }, { createServer }] = await Promise.all([
    import(PROJECT + '/node_modules/@vitejs/plugin-react/dist/index.js'),
    import(PROJECT + '/node_modules/vite-plugin-pwa/dist/index.js'),
    import(PROJECT + '/node_modules/vite/dist/node/index.js'),
  ]);

  const server = await createServer({
    root: PROJECT,
    configFile: false, // skip vite.config.ts — avoids ESM __dirname='.' bug
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icons/*.png'],
        manifest: {
          name: 'Aquafeel VIP Proposal',
          short_name: 'Aquafeel VIP',
          description: 'Aquafeel VIP Proposal — The smart water consultation solution.',
          theme_color: '#0d9488',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
    ],
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      port: 5173,
      host: true,
      strictPort: false,
      hmr: { overlay: false },
    },
  });

  await server.listen();
  server.printUrls();
  console.log('[launcher] Vite dev server ready.');
}

main().catch((e) => {
  console.error('[launcher] startup failed:', e.message || e);
  process.exit(1);
});
