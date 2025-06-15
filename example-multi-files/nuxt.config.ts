export default {
    // Nuxt config
    modules: ['@nuxtjs/i18n'],

    // i18n configuration with multiple files per locale
    i18n: {
        defaultLocale: 'en',
        langDir: 'locales',
        locales: [
            {
                code: 'en',
                iso: 'en-US',
                name: 'English',
                files: ['en/common.json', 'en/home.json', 'en/about.json']
            },
            {
                code: 'es',
                iso: 'es-ES',
                name: 'Español',
                files: ['es/common.json', 'es/home.json', 'es/about.json']
            },
            {
                code: 'fr',
                iso: 'fr-FR',
                name: 'Français',
                files: ['fr/common.json', 'fr/home.json', 'fr/about.json']
            }
        ],
        lazy: true,
        strategy: 'prefix_except_default'
    }
} 