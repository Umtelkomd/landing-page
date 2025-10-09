import React from 'react';
import { motion } from 'framer-motion';
import useTranslation from '../hooks/useTranslation';
import Navbar from '../components/Navbar';
import Hero from '../sections/Hero';
import Services from '../sections/Services';
import Gallery from '../sections/Gallery';
import About from '../sections/About';
import Map from '../sections/Map';
import Footer from '../components/Footer';

const HomePage = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="app-container">
      <motion.div
        key="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="app-container__content"
      >
        <Navbar language={language} setLanguage={setLanguage} t={t} />
        <main className="app-container__main">
          <Hero t={t} />
          <Services t={t} />
          <Gallery t={t} />
          <About t={t} />
          <Map t={t} />
        </main>
        <Footer t={t} />
      </motion.div>
    </div>
  );
};

export default HomePage;