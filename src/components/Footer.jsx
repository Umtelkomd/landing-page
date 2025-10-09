import React from 'react';
import { MapPin, Phone, Mail, Send, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import styles from './Footer.module.scss';
import logoImage from '../images/logo_azul.png';

const Footer = ({ t }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.footerBackground}>
                <div className={styles.footerGlow}></div>
                <div className={styles.footerGlow}></div>
                <div className={styles.footerGlow}></div>
            </div>

            <div className={styles.container}>
                <div className={styles.footerGrid}>
                    {/* Columna 1: Logo e información de la empresa */}
                    <div className={styles.logoSection}>
                        <img src={logoImage} alt="UMTELKOMD Logo" className={styles.logoImg} />
                    </div>

                    {/* Columna 2: Enlaces útiles */}
                    <div className={styles.linksSection}>
                        <h3 className={styles.footerTitle}>Secciones</h3>
                        <ul className={styles.footerLinks}>
                            <li><a href="#services" className={styles.footerLink}>{t('navServices')}</a></li>
                            <li><a href="#gallery" className={styles.footerLink}>{t('navGallery')}</a></li>
                            <li><a href="#about" className={styles.footerLink}>{t('navAbout')}</a></li>
                            <li><a href="#contact" className={styles.footerLink}>{t('navContact')}</a></li>
                        </ul>
                    </div>

                    {/* Columna 3: Información de contacto */}
                    <div className={styles.contactSection}>
                        <h3 className={styles.footerTitle}>Contacto</h3>
                        <div className={styles.contactInfo}>
                            <div className={styles.contactItem}>
                                <MapPin size={18} className={styles.contactIcon} />
                                <span>{t('contactAddressValue')}</span>
                            </div>
                            <div className={styles.contactItem}>
                                <Phone size={18} className={styles.contactIcon} />
                                <span><strong>{t('contactPhone')}:</strong> {t('contactPhoneValue')}</span>
                            </div>
                            <div className={styles.contactItem}>
                                <Mail size={18} className={styles.contactIcon} />
                                <div className={styles.contactDetails}>
                                    <div><strong>{t('contactEmail')}:</strong> {t('contactEmailValue')}</div>
                                    <div><strong>{t('contactTechnical')}:</strong> {t('contactTechnicalValue')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna 4: Newsletter */}
                    <div className={styles.newsletterSection}>
                        <h3 className={styles.footerTitle}>{t('footerNewsletter')}</h3>
                        <p className={styles.newsletterText}>
                            {t('footerSubscribe')}
                        </p>
                        <div className={styles.subscribeForm}>
                            <input
                                type="email"
                                placeholder={t('footerEmailPlaceholder')}
                                className={styles.emailInput}
                            />
                            <button type="button" className={styles.subscribeButton}>
                                <Send size={16} />
                            </button>
                        </div>
                        <div className={styles.socialLinks}>
                            <a href="#" className={styles.socialLink}>
                                <Linkedin size={20} />
                            </a>
                            <a href="#" className={styles.socialLink}>
                                <Twitter size={20} />
                            </a>
                            <a href="#" className={styles.socialLink}>
                                <Facebook size={20} />
                            </a>
                            <a href="#" className={styles.socialLink}>
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className={styles.divider}></div>

                {/* Copyright */}
                <div className={styles.copyright}>
                    <p>{t('footerRights').replace('2024', currentYear)}</p>
                    <p>{t('footerDeveloped')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;