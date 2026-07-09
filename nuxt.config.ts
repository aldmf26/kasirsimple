// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vueuse/nuxt'
  ],

  ui: {
    global: true,
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
