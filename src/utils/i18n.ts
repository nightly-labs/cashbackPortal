import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import { publicPath } from './publicPath';
//   import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(Backend)
    // .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        ns: ['DEFAULT'],
        defaultNS: 'DEFAULT',
        // When a key is missing in the active (platform) namespace, fall
        // back to DEFAULT so platform translation files only need to
        // override the strings that actually differ.
        fallbackNS: 'DEFAULT',
        partialBundledLanguages: true,
        backend: {
            loadPath: publicPath('{{ns}}/translations/{{lng}}.json'),
        },
        // detection: {
        //     order: ['querystring', 'navigator'],
        //     lookupQuerystring: 'lang'
        // },
        interpolation: {
            escapeValue: false,
        },
        // debug: true
    });

export default i18n;
