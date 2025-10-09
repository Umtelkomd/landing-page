import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, ExternalLink } from 'lucide-react';
import styles from './Contact.module.scss';

const Contact = ({ t }) => {
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    // Datos de contacto
    const contactMethods = [
        {
            icon: MapPin,
            titleKey: 'contactAddress',
            valueKey: 'contactAddressValue',
            color: '#38bdf8', // Azure
            actionText: 'Ver en mapa',
            actionIcon: ExternalLink,
            actionUrl: 'https://maps.google.com'
        },
        {
            icon: Phone,
            titleKey: 'contactPhone',
            valueKey: 'contactPhoneValue',
            color: '#2dd4bf', // Teal
            actionText: 'Llamar',
            actionIcon: Phone,
            actionUrl: t => `tel:${t('contactPhoneValue').replace(/\s/g, '')}`
        },
        {
            icon: Mail,
            titleKey: 'contactEmail',
            valueKey: 'contactEmailValue',
            color: '#34d399', // Emerald
            actionText: 'Email',
            actionIcon: Send,
            actionUrl: t => `mailto:${t('contactEmailValue')}`
        }
    ];

    return (
        <section id="contact" className={styles.contactSection}>
            {/* Elemento decorativo de fondo */}
            <div className={styles.decorativeLine}></div>

            <div className={styles.container}>
                {/* Título y subtítulo */}
                <motion.div
                    className={styles.titleContainer}
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={styles.title}>
                        {t('contactTitle')}
                    </h2>
                    <p className={styles.subtitle}>
                        {t('contactSubtitle')}
                    </p>
                </motion.div>

                {/* Contenedor principal con tarjetas de contacto */}
                <motion.div
                    className={styles.contactCards}
                    variants={container}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {contactMethods.map((method, index) => (
                        <motion.div
                            key={method.titleKey}
                            className={styles.contactCard}
                            variants={item}
                            style={{
                                '--card-color': method.color,
                                '--animation-delay': `${index * 0.2}s`
                            }}
                        >
                            <div className={styles.cardIcon}>
                                <method.icon size={24} />
                            </div>
                            <div className={styles.cardContent}>
                                <div className={styles.textContent}>
                                    <h3>{t(method.titleKey)}</h3>
                                    <p>{t(method.valueKey)}</p>
                                </div>
                                {typeof method.actionUrl === 'function'
                                    ? <a
                                        href={method.actionUrl(t)}
                                        className={styles.actionButton}
                                        aria-label={method.actionText}
                                        title={method.actionText}
                                    >
                                        <method.actionIcon size={16} />
                                    </a>
                                    : <a
                                        href={method.actionUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.actionButton}
                                        aria-label={method.actionText}
                                        title={method.actionText}
                                    >
                                        <method.actionIcon size={16} />
                                    </a>
                                }
                            </div>
                            <div className={styles.cardDecoration}></div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Contact; 