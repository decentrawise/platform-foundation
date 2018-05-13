import { addLocaleData } from 'react-intl';


export function getAvailableLanguages() {
  return {
    en: 'English',
    pt: 'Português',
    es: 'Español',
    fr: 'Francais'
  };
}

export function loadLocaleData() {
  const en = require('react-intl/locale-data/en');
  const pt = require('react-intl/locale-data/pt');
  const es = require('react-intl/locale-data/es');
  const fr = require('react-intl/locale-data/fr');

  addLocaleData([...en, ...pt, ...es, ...fr]);
}

export function getMessages() {
  return {
    en: require('./messages/en.json'),
    pt: require('./messages/pt.json'),
    es: require('./messages/es.json'),
    fr: require('./messages/fr.json')
  };
}

export function getCurrentLocale() {
  var locale = window.localStorage.getItem('l');

  if(!locale) {
    locale = navigator.language || navigator.userLanguage || 'en';

    if(locale.length !== 2) {
      locale = locale.replace(/[-_].*$/, '');
    }

    window.localStorage.setItem('l', locale);
  }

  return locale;
}

export function setCurrentLocale(locale) {
  window.localStorage.setItem('l', locale);
  // TODO: force render??
}

export default {
  getAvailableLanguages,
  loadLocaleData,
  getMessages,
  getCurrentLocale,
  setCurrentLocale
}
