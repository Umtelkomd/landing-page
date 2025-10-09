import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './Navbar.module.scss';
import logoImage from '../images/logo_azul.png';

const Navbar = ({ language, setLanguage, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const location = useLocation();

    const navItems = [
        { id: 'home', label: t('navHome'), type: 'scroll' },
        { id: 'services', label: t('navServices'), type: 'scroll' },
        { id: 'gallery', label: t('navGallery'), type: 'scroll' },
        { id: 'about', label: t('navAbout'), type: 'scroll' },
        { id: 'map', label: t('navMap'), type: 'scroll' },
        { id: 'contact', label: t('navContact'), type: 'route', path: '/contact' },
    ];

    const handleNavClick = (item) => {
        if (item.type === 'route') {
            setIsOpen(false);
            return; // Let the Link component handle navigation
        } else {
            scrollToSection(item.id);
        }
    };

    const scrollToSection = (id) => {
        // Only scroll if we're on the home page
        if (location.pathname !== '/') {
            window.location.href = `/#${id}`;
            return;
        }
        
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsOpen(false);
    };

    // Nuevo: Función para determinar qué sección está activa basada en la posición de scroll
    const determineActiveSection = () => {
        // Obtenemos las coordenadas y alturas de cada sección
        const sectionPositions = navItems
            .map(item => {
                const element = document.getElementById(item.id);
                if (!element) return null;

                const rect = element.getBoundingClientRect();
                // Calculamos la distancia de la parte superior de la sección desde la parte superior de la ventana
                // Agregamos un pequeño offset (0.1 * ventana) para activar un poco antes
                const topOffset = rect.top - (window.innerHeight * 0.1);

                return {
                    id: item.id,
                    top: topOffset
                };
            })
            .filter(Boolean); // Eliminar nulos (en caso de que alguna sección no exista)

        // Encontrar la sección más cercana a la parte superior (con prioridad a las que están ya en viewport)
        const activeSections = sectionPositions
            .filter(section => section.top <= 0) // Filtrar secciones que ya están en o por encima del viewport
            .sort((a, b) => b.top - a.top); // Ordenar de mayor a menor (la más cercana a 0 primero)

        // Si hay secciones en o por encima del viewport, tomar la primera (la más cercana al borde superior)
        if (activeSections.length > 0) {
            console.log('Sección activa: ', activeSections[0].id);
            setActiveSection(activeSections[0].id);
        } else if (sectionPositions.length > 0) {
            // Si ninguna sección está en el viewport (estamos por encima de todas), activar la primera
            console.log('Estamos antes de todas las secciones, activando: ', sectionPositions[0].id);
            setActiveSection(sectionPositions[0].id);
        }
    };

    // Nuevo: Escuchar el evento scroll para detectar la sección activa
    useEffect(() => {
        // Determinar sección activa en el montaje inicial
        determineActiveSection();

        // Añadir listener de scroll
        window.addEventListener('scroll', determineActiveSection);

        // Limpiar listener al desmontar
        return () => {
            window.removeEventListener('scroll', determineActiveSection);
        };
    }, []); // Solo ejecutar en montaje/desmontaje

    return (
        <motion.nav
            className={styles.navbar}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Logo */}
                    <Link to="/" className={styles.logoContainer}>
                        <img src={logoImage} alt="Umtelkomd Logo" className={styles.logoImg} />
                    </Link>

                    {/* Navegación Desktop */}
                    <div className={styles.navDesktop}>
                        {navItems.map((item) => (
                            item.type === 'route' ? (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`${styles.navLink} ${location.pathname === item.path ? styles.activeLink : ''}`}
                                    onClick={() => handleNavClick(item)}
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item)}
                                    className={`${styles.navLink} ${activeSection === item.id && location.pathname === '/' ? styles.activeLink : ''}`}
                                    aria-label={`Ir a la sección ${item.label}`}
                                    aria-current={activeSection === item.id && location.pathname === '/' ? 'page' : undefined}
                                >
                                    {item.label}
                                </button>
                            )
                        ))}
                        <LanguageSwitcher currentLang={language} onChangeLang={setLanguage} t={t} />
                    </div>

                    {/* Botón Menú Móvil */}
                    <div className={styles.menuButtonContainer}>
                        <div className={styles.langSwitcherMobile}>
                            <LanguageSwitcher currentLang={language} onChangeLang={setLanguage} t={t} />
                        </div>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={styles.menuButton}
                            aria-expanded={isOpen}
                            aria-label="Abrir menú principal"
                        >
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menú Móvil */}
            {isOpen && (
                <motion.div
                    className={styles.navMobile}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <div className={styles.mobileMenuContent}>
                        {navItems.map((item) => (
                            item.type === 'route' ? (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`${styles.navLink} ${location.pathname === item.path ? styles.activeLink : ''}`}
                                    onClick={() => handleNavClick(item)}
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item)}
                                    className={`${styles.navLink} ${activeSection === item.id && location.pathname === '/' ? styles.activeLink : ''}`}
                                    aria-label={`Ir a la sección ${item.label}`}
                                    aria-current={activeSection === item.id && location.pathname === '/' ? 'page' : undefined}
                                >
                                    {item.label}
                                </button>
                            )
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
};

export default Navbar; 