import React from 'react';
import { motion } from 'framer-motion';
import { Network, Cable, Wrench, Clipboard } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import styles from './Services.module.scss';

const Services = ({ t }) => {

    const serviceList = [
        {
            id: 's1',
            titleKey: 'service1Title',
            descKey: 'service1Desc',
            tasksKey: 'service1Tasks',
            icon: Network
        },
        {
            id: 's2',
            titleKey: 'service2Title',
            descKey: 'service2Desc',
            tasksKey: 'service2Tasks',
            icon: Cable
        },
        {
            id: 's3',
            titleKey: 'service3Title',
            descKey: 'service3Desc',
            tasksKey: 'service3Tasks',
            icon: Wrench
        },
        {
            id: 's4',
            titleKey: 'service4Title',
            descKey: 'service4Desc',
            tasksKey: 'service4Tasks',
            icon: Clipboard
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const titleVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const accentVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 1,
                ease: "easeOut"
            }
        }
    };

    const titleText = t('servicesTitle');
    const subtitleText = t('servicesSubtitle');

    return (
        <section id="services" className={styles.servicesSection}>
            <div className={styles.container}>
                <motion.div
                    className={styles.titleContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px 0px" }}
                >
                    <motion.div className={styles.titleAccent} variants={accentVariants} />
                    <motion.div className={styles.titleAccent} variants={accentVariants} />
                    <motion.div className={styles.titleAccent} variants={accentVariants} />

                    <motion.h2
                        className={styles.title}
                        variants={titleVariants}
                    >
                        {titleText}
                    </motion.h2>

                    <motion.div
                        className={styles.titleUnderline}
                        variants={titleVariants}
                    />

                    <motion.p
                        className={styles.titleSubtext}
                        variants={titleVariants}
                        transition={{ delay: 0.2 }}
                    >
                        {subtitleText}
                    </motion.p>
                </motion.div>

                <motion.div
                    className={styles.grid}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {serviceList.map((service) => (
                        <motion.div key={service.id} variants={itemVariants}>
                            <ServiceCard
                                title={t(service.titleKey)}
                                description={t(service.descKey)}
                                tasks={t(service.tasksKey)}
                                icon={service.icon}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Services;