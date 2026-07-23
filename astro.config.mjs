// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  server: {
    port: 3000
  },

  integrations: [
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      devOptions: { enabled: true },
      manifest: {
        name: 'unmindful',
        short_name: 'unmindful',
        description: 'A morning at the letterpress museum.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}']
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel()
});