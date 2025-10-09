import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';
import Contact from '../sections/Contact';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ContactPage = () => {
    const { language, setLanguage, t } = useTranslation();
    return (
        <div className="contact-page">
            <Navbar 
                language={language}
                setLanguage={setLanguage}
                t={t}
            />
            
            <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
                <div style={{ 
                    padding: '2rem', 
                    maxWidth: '1200px', 
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <Link 
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#2dd4bf',
                            textDecoration: 'none',
                            fontSize: '1rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <ArrowLeft size={20} />
                        {t('backToHome')}
                    </Link>
                </div>
                
                <Contact t={t} />
            </div>
            
            <Footer t={t} />
        </div>
    );
};

export default ContactPage;