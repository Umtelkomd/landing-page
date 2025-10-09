import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OTDRDisplay from '../components/OTDRDisplay';
import MobileCarousel from '../components/MobileCarousel';
import styles from './Gallery.module.scss';

// Importar las imágenes de la galería
import imgLlaveEnMano from '../images/services/llaveenmano.png';
import imgN3N4 from '../images/services/n3n4.png';
import imgAverias from '../images/services/averias.png';
import imgActivacion from '../images/services/activacion.png';
import imgFusionTarjetas from '../images/services/fusiontarjetas.png';
import imgSoplado from '../images/services/soplado.png';

// Array con las imágenes importadas
const galleryImages = [
    imgLlaveEnMano,
    imgN3N4,
    imgAverias,
    imgActivacion,
    imgFusionTarjetas,
    imgSoplado,
];

const Gallery = ({ t }) => {
    // Estado para el índice de la imagen actual (para el OTDR)
    const [currentIndex, setCurrentIndex] = useState(0);

    // Función para ir a la imagen anterior
    const prevImage = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
        );
    };

    // Función para ir a la siguiente imagen
    const nextImage = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
        );
    };

    return (
        <section id="gallery" className={styles.gallerySection}>
            <div className={styles.container}>
                <motion.div
                    className={styles.titleContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px 0px" }}
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

                    <motion.h2
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
                    >
                        {t('galleryTitle')}
                    </motion.h2>

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

                    <motion.p
                        className={styles.titleSubtext}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                    duration: 0.8,
                                    ease: "easeOut",
                                    delay: 0.2
                                }
                            }
                        }}
                    >
                        {t('gallerySubtitle')}
                    </motion.p>
                </motion.div>

                {/* Renderizar OTDR (visible en >md) y Carrusel (visible en <md) */}
                {/* Los estilos en los .module.scss controlan la visibilidad */}
                <OTDRDisplay
                    images={galleryImages}
                    currentIndex={currentIndex}
                    prevImage={prevImage}
                    nextImage={nextImage}
                />
                <MobileCarousel images={galleryImages} />
            </div>
        </section>
    );
};

export default Gallery; 