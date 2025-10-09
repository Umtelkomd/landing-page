import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './OTDRDisplay.module.scss';

const OTDRDisplay = ({ images, currentIndex, prevImage, nextImage }) => {
    if (!images || images.length === 0) {
        return <div>No hay imágenes para mostrar.</div>; // O algún placeholder
    }

    return (
        <div className={styles.otdrContainer}>
            <motion.div
                className={styles.otdrBody}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                {/* Pantalla del OTDR */}
                <div className={styles.screen}>
                    <motion.img
                        key={currentIndex} // Key para animar el cambio de imagen
                        src={images[currentIndex]}
                        alt={`Imagen de galería ${currentIndex + 1}`}
                        className={styles.image}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                    <div className={styles.screenOverlay}></div>
                </div>

                {/* Controles del OTDR */}
                <div className={styles.controls}>
                    <div>
                        <div className={styles.brand}>EXFO</div>
                        <div className={styles.modelInfo}>OTDR Pro Series</div>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button onClick={prevImage} className={styles.button} aria-label="Imagen anterior">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextImage} className={styles.button} aria-label="Siguiente imagen">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                {/* Detalles estéticos */}
                <div className={styles.vents}></div>
                <div className={styles.handle}></div>
            </motion.div>
        </div>
    );
};

export default OTDRDisplay; 