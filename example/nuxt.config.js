module.exports = {
  // Nuxt config
  modules: ['@nuxtjs/i18n'],
  
  // i18n configuration
  i18n: {
    defaultLocale: 'en',
    langDir: 'locales/',
    locales: [
      {
        code: 'en',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'fr',
        file: 'fr.json',
        name: 'Français'
      },
      {
        code: 'de',
        file: 'de.json',
        name: 'Deutsch'
      },
      {
        code: 'es',
        file: 'es.json',
        name: 'Español'
      },
      {
        code: 'it',
        file: 'it.json',
        name: 'Italiano'
      },
      {
        code: 'pl',
        file: 'pl.json',
        name: 'Polski'
      }
    ],
    lazy: true,
    strategy: 'prefix_except_default'
  }
} 