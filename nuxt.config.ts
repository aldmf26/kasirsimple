// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
    enabled: true
  },

  css: ['@/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  supabase: {
    redirect: false
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
