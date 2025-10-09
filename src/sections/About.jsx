import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart, Telescope, Award } from 'lucide-react'; // Iconos más representativos
import styles from './About.module.scss'; // Importar SCSS module

const About = ({ t }) => {

    const fadeIn = (delay = 0) => ({
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                delay: delay
            }
        }
    });

    return (
        <section id="about" className={styles.aboutSection}>
            <div className={styles.container}>
                <div className={styles.titleWrapper}>
                    <motion.h2
                        className={styles.title}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn()}
                    >
                        {t('aboutTitle')}
                    </motion.h2>

                    <motion.p
                        className={styles.subtitle}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn(0.2)}
                    >
                        {t('aboutSubtitle')}
                    </motion.p>
                </div>

                <div className={styles.grid}>
                    {/* Historia */}
                    <motion.div
                        className={styles.card}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn(0.2)}
                    >
                        <Zap size={36} className={styles.icon} />
                        <h3 className={styles.cardTitle}>{t('aboutHistoryTitle')}</h3>
                        <p className={styles.cardDescription}>{t('aboutHistoryDesc')}</p>
                    </motion.div>

                    {/* Misión */}
                    <motion.div
                        className={styles.card}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn(0.4)}
                    >
                        <Heart size={36} className={styles.icon} />
                        <h3 className={styles.cardTitle}>{t('aboutMissionTitle')}</h3>
                        <p className={styles.cardDescription}>{t('aboutMissionDesc')}</p>
                    </motion.div>

                    {/* Visión */}
                    <motion.div
                        className={styles.card}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn(0.6)}
                    >
                        <Telescope size={36} className={styles.icon} />
                        <h3 className={styles.cardTitle}>{t('aboutVisionTitle')}</h3>
                        <p className={styles.cardDescription}>{t('aboutVisionDesc')}</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About; 