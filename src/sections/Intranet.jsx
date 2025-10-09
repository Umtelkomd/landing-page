import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Mail, FileText, Database, Settings, Users, BarChart3 } from 'lucide-react';
import styles from './Intranet.module.scss';

const Intranet = ({ t }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulación de login - en producción conectaría con API real
    if (credentials.username === 'admin' && credentials.password === 'umtel2024') {
      setIsLoggedIn(true);
    }
  };

  const intranetServices = [
    {
      icon: FileText,
      titleKey: 'intranetDocuments',
      descKey: 'intranetDocumentsDesc',
      color: '#4F46E5'
    },
    {
      icon: Database,
      titleKey: 'intranetProjects',
      descKey: 'intranetProjectsDesc',
      color: '#059669'
    },
    {
      icon: Users,
      titleKey: 'intranetTeam',
      descKey: 'intranetTeamDesc',
      color: '#DC2626'
    },
    {
      icon: BarChart3,
      titleKey: 'intranetReports',
      descKey: 'intranetReportsDesc',
      color: '#EA580C'
    },
    {
      icon: Settings,
      titleKey: 'intranetTools',
      descKey: 'intranetToolsDesc',
      color: '#7C3AED'
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section id="intranet" className={styles.intranetSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.titleWrapper}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <h2 className={styles.title}>{t('intranetTitle')}</h2>
          <p className={styles.subtitle}>{t('intranetSubtitle')}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isLoggedIn ? (
            <motion.div
              key="login"
              className={styles.loginContainer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                  <Lock className={styles.loginIcon} size={32} />
                  <h3>{t('intranetLogin')}</h3>
                  <p>{t('intranetLoginDesc')}</p>
                </div>
                
                <form onSubmit={handleLogin} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <User size={20} />
                    <input
                      type="text"
                      placeholder={t('intranetUsername')}
                      value={credentials.username}
                      onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <Lock size={20} />
                    <input
                      type="password"
                      placeholder={t('intranetPassword')}
                      value={credentials.password}
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    />
                  </div>
                  
                  <motion.button
                    type="submit"
                    className={styles.loginButton}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('intranetAccess')}
                  </motion.button>
                </form>
                
                <p className={styles.loginNote}>
                  {t('intranetNote')}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              className={styles.dashboard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.welcomeHeader}>
                <h3>{t('intranetWelcome')}</h3>
                <motion.button
                  className={styles.logoutButton}
                  onClick={() => setIsLoggedIn(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('intranetLogout')}
                </motion.button>
              </div>

              <motion.div
                className={styles.servicesGrid}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {intranetServices.map((service, index) => (
                  <motion.div
                    key={index}
                    className={styles.serviceCard}
                    variants={fadeIn}
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)' 
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      className={styles.serviceIcon}
                      style={{ backgroundColor: service.color }}
                    >
                      <service.icon size={24} />
                    </div>
                    <h4>{t(service.titleKey)}</h4>
                    <p>{t(service.descKey)}</p>
                    <motion.button
                      className={styles.serviceButton}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('intranetAccess')}
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Intranet;