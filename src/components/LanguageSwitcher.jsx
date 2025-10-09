import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import styles from './LanguageSwitcher.module.scss'; // Importar SCSS module

const LanguageSwitcher = ({ currentLang, onChangeLang, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const languages = [
        { code: 'es', name: 'Español' },
        { code: 'en', name: 'English' },
        { code: 'de', name: 'Deutsch' },
    ];
    const wrapperRef = useRef(null);

    // Cerrar dropdown si se hace clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleLanguageChange = (langCode) => {
        onChangeLang(langCode);
        setIsOpen(false); // Cerrar al seleccionar
    };

    return (
        <div className={styles.container} ref={wrapperRef}>
            <button
                className={styles.button}
                onClick={() => setIsOpen(!isOpen)} // Toggle en clic
                aria-label={t('language')}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <Globe size={20} className={styles.icon} />
                <span className={styles.text}>{currentLang}</span>
            </button>
            <div
                className={`${styles.dropdown} ${isOpen ? styles.visible : ''}`}
                role="menu"
            >
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`${styles.dropdownItem} ${currentLang === lang.code ? styles.active : ''}`}
                        role="menuitem"
                    >
                        {lang.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher; 