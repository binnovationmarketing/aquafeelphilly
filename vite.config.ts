import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // expiration plugin removed — workbox-expiration ESM export broken with this vite-plugin-pwa version
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],

  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },

  server: {
    host: true,
    hmr: { overlay: false }
  },

  build: {
    // Raise warning limit — chunks above are expected after splitting
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks: {
          // React core — always needed, cache aggressively
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Animation — large but only used in proposal/welcome screens
          'vendor-motion': ['framer-motion'],

          // Charts — only used in dashboards, never on public proposal
          'vendor-charts': ['recharts'],

          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],

          // AI + utility libs
          'vendor-misc': [
            '@google/generative-ai',
            'zustand',
            'sonner',
            'lucide-react',
            'qrcode.react',
            'canvas-confetti'
          ],
        }
      }
    }
  }
});
