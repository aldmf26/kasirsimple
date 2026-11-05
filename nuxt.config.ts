// https://nuxt.com/docs/api/configuration/nuxt-config
const THEME_COLOR = '#2563eb' // browser bar + installed app (blue-600, the app's primary)

export default defineNuxtConfig({
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      meta: [{ name: 'theme-color', content: THEME_COLOR }],
      link: [{ rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }]
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt'
  ],

  // Installable app + offline shell. Pages are SSR, so they are cached when
  // visited (NetworkFirst) instead of precached; build assets are precached.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'KasirOK',
      short_name: 'KasirOK',
      description: 'Aplikasi kasir sederhana untuk toko dan warung',
      lang: 'id',
      start_url: '/dashboard',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: THEME_COLOR,
      background_color: '#f8fafc',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
      globIgnores: ['**/hero_pos.png'],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'pages', networkTimeoutSeconds: 4, expiration: { maxEntries: 30 } }
        },
        {
          urlPattern: /\/api\/_nuxt_icon\//,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'icons', expiration: { maxEntries: 50 } }
        },
        {
          urlPattern: /\/storage\/v1\/object\/public\//,
          handler: 'CacheFirst',
          options: { cacheName: 'product-images', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 } }
        }
      ]
    },
    client: { installPrompt: false },
    devOptions: { enabled: false }
  },

  ui: {
    global: true,
    // App is designed light-only; following the device's dark mode turned only
    // the Nuxt UI parts (inputs, neutral buttons) dark on light pages.
    colorMode: false,
    safelistColors: ['emerald', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone']
  },

  components: {
    dirs: [
      {
        path: '~/components',
        global: true
      }
    ]
  },

  devtools: {
    enabled: false
  },

  css: ['@/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  supabase: {
    redirect: false
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://kasirok.vercel.app'
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
