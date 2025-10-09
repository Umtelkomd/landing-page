import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';
import Intranet from '../sections/Intranet';
import styles from './IntranetPage.module.scss';

const IntranetPage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.intranetPage}>
      {/* Header with navigation */}
      <motion.header 
        className={styles.header}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.headerContainer}>
          <Link to="/" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>{t('backToHome')}</span>
          </Link>
          
          <div className={styles.logo}>
            <img src="/images/logo_azul.png" alt="UMTELKOMD" className={styles.logoImg} />
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <motion.main 
        className={styles.main}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Intranet t={t} />
      </motion.main>
    </div>
  );
};

export default IntranetPage;