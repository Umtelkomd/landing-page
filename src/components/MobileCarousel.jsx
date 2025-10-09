import React from 'react';
import { motion } from 'framer-motion';
import styles from './MobileCarousel.module.scss';

const MobileCarousel = ({ images }) => {
    if (!images || images.length === 0) {
        return <div>No hay imágenes para mostrar.</div>;
    }

    return (
        <div className={styles.mobileCarouselContainer}>
            <div className={styles.carousel}>
                {images.map((image, index) => (
                    <motion.div
                        key={index}
                        className={styles.slide}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <img
                            src={image}
                            alt={`Imagen de galería ${index + 1}`}
                            className={styles.image}
                            loading="lazy" // Carga diferida para imágenes
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MobileCarousel; 