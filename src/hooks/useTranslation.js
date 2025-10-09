import { useState, useCallback } from 'react';
import { translations } from '../i18n/translations.js';

const useTranslation = () => {
  const [language, setLanguage] = useState('de'); // Idioma por defecto: Alemán

  const setLang = useCallback((lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    } else {
      console.warn(`Language '${lang}' not found. Falling back to 'de'.`);
      setLanguage('de');
    }
  }, []);

  const t = useCallback((key) => {
    return translations[language][key] || key; // Devuelve la clave si no se encuentra la traducción
  }, [language]);

  return { language, setLanguage: setLang, t };
};

export default useTranslation; 