// import i18n from 'i18next';
import resources from './locales/index.js';
import app from './app.js';

export default async () => {
  const defaultLanguage = 'ru';
  const i18nInstance = i18n.createInstance();
  await i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });
  app(i18nInstance);
};
