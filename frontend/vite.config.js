import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new version installs itself; the page reloads onto it (see main.jsx).
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon-48.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Ayush Lab',
        short_name: 'Ayush Lab',
        description: 'Laboratory management: patients, tests, results and reports',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f7f9',
        theme_color: '#1d306e',
        categories: ['medical', 'productivity', 'business'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Patients', url: '/patients', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Assign Tests', url: '/assignments/new', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Result Entry', url: '/results', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      // Only the app shell (JS/CSS/HTML/icons) is cached so the app opens fast
      // and installs. Lab data (/api) always comes from the network, never a
      // stale offline copy.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/exceljs*.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: ({ url }) => /\/assets\/exceljs.*\.js$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'excel-lib' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': process.env.API_TARGET || 'http://localhost:5000' },
  },
});
