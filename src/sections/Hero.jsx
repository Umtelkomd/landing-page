import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Database, Router, Cable, Wifi } from 'lucide-react';
import styles from './Hero.module.scss'; // Importar SCSS module

const Hero = ({ t }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { scrollY } = useScroll();
    const parallaxY = useTransform(scrollY, [0, 1000], [0, -200]);
    const opacityTransform = useTransform(scrollY, [0, 300], [1, 0.3]);

    // Nodos de la red de fibra óptica - Procesos específicos
    const networkNodes = [
        {
            type: 'central',
            icon: Database,
            labelKey: 'fiberCentral'
        },
        {
            type: 'pop',
            icon: Router,
            labelKey: 'fiberPOP'
        },
        {
            type: 'dp',
            icon: Cable,
            labelKey: 'fiberDistribucion'
        },
        {
            type: 'client',
            icon: Wifi,
            labelKey: 'fiberCliente'
        }
    ];

    // Controlador para el movimiento del mouse
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: e.clientX / window.innerWidth,
                y: e.clientY / window.innerHeight,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Controlador para activar la animación de los nodos cuando el pulso pasa por ellos
    useEffect(() => {
        const activateNodeAnimations = () => {
            // Activamos las animaciones en ciclos de 6 segundos (duración del pulso)
            const nodes = document.querySelectorAll(`.${styles.nodePoint}`);
            nodes.forEach((node, index) => {
                setTimeout(() => {
                    node.classList.add(styles.glowing);
                    setTimeout(() => {
                        node.classList.remove(styles.glowing);
                    }, 500);
                }, (index + 1) * 1500); // Sincronizado con los tiempos de paso del pulso
            });
        };

        // Iniciar el ciclo de animación
        const animationInterval = setInterval(activateNodeAnimations, 6000);
        activateNodeAnimations(); // Activar inmediatamente

        // Limpiar el intervalo cuando el componente se desmonte
        return () => clearInterval(animationInterval);
    }, []);

    return (
        <section
            id="home"
            className={styles.heroSection} // Aplicar clase
        >
            {/* Fondo */}
            <motion.div 
                className={styles.backgroundContainer}
                style={{ y: parallaxY, opacity: opacityTransform }}
            >
                <motion.div
                    className={styles.animatedGradient}
                    style={{ 
                        backgroundSize: '200% 200%', 
                        backgroundPosition: `${50 + mousePosition.x * 10}% ${50 + mousePosition.y * 10}%`,
                    }}
                    animate={{
                        backgroundPosition: [
                            '0% 50%',
                            '100% 50%',
                            '0% 50%'
                        ]
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <motion.div
                    className={styles.backgroundImage}
                    style={{ 
                        backgroundImage: `url(${process.env.PUBLIC_URL}/images/background.webp)`,
                        transform: `translate(${mousePosition.x * 20 - 10}px, ${mousePosition.y * 20 - 10}px)`,
                    }}
                />
            </motion.div>

            {/* Contenido */}
            <motion.div
                className={styles.contentContainer}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    duration: 1.2, 
                    delay: 0.3,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                }}
            >
                <motion.div
                    className={styles.titleContainer}
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.5
                            }
                        }
                    }}
                >
                    <motion.div 
                        className={styles.titleAccent} 
                        variants={{
                            hidden: { opacity: 0, scale: 0.8 },
                            visible: {
                                opacity: 1,
                                scale: 1,
                                transition: { duration: 1, ease: "easeOut" }
                            }
                        }}
                    />
                    <motion.div 
                        className={styles.titleAccent} 
                        variants={{
                            hidden: { opacity: 0, scale: 0.8 },
                            visible: {
                                opacity: 1,
                                scale: 1,
                                transition: { duration: 1, ease: "easeOut", delay: 0.1 }
                            }
                        }}
                    />
                    <motion.div 
                        className={styles.titleAccent} 
                        variants={{
                            hidden: { opacity: 0, scale: 0.8 },
                            visible: {
                                opacity: 1,
                                scale: 1,
                                transition: { duration: 1, ease: "easeOut", delay: 0.2 }
                            }
                        }}
                    />

                    <motion.h1
                        className={styles.title}
                        variants={{
                            hidden: { opacity: 0, y: -30 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                    duration: 0.8,
                                    ease: "easeOut"
                                }
                            }
                        }}
                        whileHover={{ 
                            scale: 1.02,
                            transition: { duration: 0.2 }
                        }}
                    >
                        {t('heroTitle')}
                    </motion.h1>

                    <motion.div
                        className={styles.titleUnderline}
                        variants={{
                            hidden: { opacity: 0, scaleX: 0 },
                            visible: {
                                opacity: 1,
                                scaleX: 1,
                                transition: {
                                    duration: 0.8,
                                    ease: "easeOut",
                                    delay: 0.1
                                }
                            }
                        }}
                    />
                </motion.div>

                {/* Red de fibra óptica */}
                <motion.div
                    className={styles.fiberIllustration}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                        duration: 1.5, 
                        delay: 0.8,
                        type: "spring",
                        stiffness: 80,
                        damping: 20
                    }}
                    whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.3 }
                    }}
                >
                    <div className={styles.fiberNetwork}>
                        {/* Conexión de fibra - la línea que une todo */}
                        <div className={styles.fiberConnection}></div>

                        {/* Pulso de luz viajando */}
                        <div className={styles.lightPulse}></div>

                        {/* Partículas de datos */}
                        <div className={styles.dataParticles}>
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={styles.particle}></div>
                            ))}
                        </div>

                        {/* Nodos de la red */}
                        {networkNodes.map((node, index) => (
                            <motion.div
                                key={node.type}
                                className={`${styles.networkNode} ${styles[node.type]}`}
                                style={{ left: `${index * (100 / (networkNodes.length - 1))}%` }}
                                data-node-index={index}
                                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ 
                                    duration: 0.8, 
                                    delay: 1.2 + index * 0.2,
                                    type: "spring",
                                    stiffness: 150,
                                    damping: 10
                                }}
                                whileHover={{ 
                                    scale: 1.1, 
                                    y: -5,
                                    transition: { duration: 0.2 }
                                }}
                            >
                                <motion.div 
                                    className={styles.nodeIcon}
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <node.icon size={22} />
                                </motion.div>
                                <div className={styles.nodePoint}></div>
                                <div className={styles.nodeLabel}>{t(node.labelKey)}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.p 
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                        duration: 1, 
                        delay: 1.8,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                    }}
                >
                    {t('heroSubtitle')}
                </motion.p>
                {/* Ejemplo botón CTA */}
                {/* <motion.button 
          className={styles.ctaButton} // Aplicar clase
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Explorar Servicios
        </motion.button> */}
            </motion.div>
        </section>
    );
};

export default Hero; 