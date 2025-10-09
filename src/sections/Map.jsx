import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, CheckCircle, Cable, Zap } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import styles from './Map.module.scss';

const Map = ({ t }) => {
  const [activeRegion, setActiveRegion] = useState(null);

  // Datos reales de proyectos donde UMTELKOMD ha trabajado
  const workRegions = [
    {
      id: 'mecklenburg-vorpommern',
      name: 'Mecklenburg-Vorpommern',
      city: 'Deyelsdorf',
      coordinates: { x: 55, y: 20 },
      projects: 18,
      clients: 2850,
      fiberBlown: '425 km',
      activations: 892,
      yearStarted: 2020,
      status: 'active',
      description: 'Nuestra región principal de operaciones con sede central',
      keyProjects: ['Red FTTH Deyelsdorf', 'Conexión Rural Bassendorf', 'Ampliación Norte MV']
    },
    {
      id: 'lower-saxony-wolfsburg',
      name: 'Niedersachsen - Wolfsburg',
      city: 'Wolfsburg',
      coordinates: { x: 45, y: 42 },
      projects: 12,
      clients: 1650,
      fiberBlown: '295 km',
      activations: 634,
      yearStarted: 2021,
      status: 'completed',
      description: 'Proyecto industrial y residencial completado exitosamente',
      keyProjects: ['Zona Industrial Wolfsburg', 'FTTH Centro', 'Conexión VW Campus']
    },
    {
      id: 'saxony-anhalt-petersberg',
      name: 'Sachsen-Anhalt - Petersberg',
      city: 'Petersberg',
      coordinates: { x: 52, y: 55 },
      projects: 8,
      clients: 980,
      fiberBlown: '178 km',
      activations: 387,
      yearStarted: 2021,
      status: 'completed',
      description: 'Despliegue rural completado con alta satisfacción del cliente',
      keyProjects: ['Red Rural Petersberg', 'Conectividad Empresarial', 'FTTH Residencial']
    },
    {
      id: 'north-rhine-westphalia-hoexter',
      name: 'Nordrhein-Westfalen - Höxter',
      city: 'Höxter',
      coordinates: { x: 38, y: 52 },
      projects: 15,
      clients: 2100,
      fiberBlown: '356 km',
      activations: 758,
      yearStarted: 2022,
      status: 'active',
      description: 'Expansión continua en área metropolitana histórica',
      keyProjects: ['Centro Histórico Höxter', 'Red Empresarial Weser', 'FTTH Corbies']
    },
    {
      id: 'north-rhine-westphalia-meschede',
      name: 'Nordrhein-Westfalen - Meschede',
      city: 'Meschede',
      coordinates: { x: 35, y: 55 },
      projects: 9,
      clients: 1320,
      fiberBlown: '234 km',
      activations: 492,
      yearStarted: 2022,
      status: 'completed',
      description: 'Proyecto sauerland finalizado con tecnología de vanguardia',
      keyProjects: ['Red Sauerland', 'FTTH Meschede', 'Conexión Rural Bestwig']
    },
    {
      id: 'bavaria-frammersbach',
      name: 'Bayern - Frammersbach',
      city: 'Frammersbach',
      coordinates: { x: 42, y: 68 },
      projects: 6,
      clients: 750,
      fiberBlown: '167 km',
      activations: 285,
      yearStarted: 2022,
      status: 'completed',
      description: 'Proyecto rural bávaro con desafíos topográficos superados',
      keyProjects: ['FTTH Frammersbach', 'Conexión Forestal', 'Red Spessart']
    },
    {
      id: 'bavaria-kist',
      name: 'Bayern - Kist',
      city: 'Kist',
      coordinates: { x: 44, y: 70 },
      projects: 11,
      clients: 1485,
      fiberBlown: '289 km',
      activations: 573,
      yearStarted: 2021,
      status: 'active',
      description: 'Área metropolitana de Würzburg con crecimiento constante',
      keyProjects: ['FTTH Kist', 'Zona Industrial Main', 'Conexión Würzburg Sur']
    },
    {
      id: 'bavaria-ochsenfurt',
      name: 'Bayern - Ochsenfurt',
      city: 'Ochsenfurt',
      coordinates: { x: 43, y: 72 },
      projects: 7,
      clients: 920,
      fiberBlown: '156 km',
      activations: 341,
      yearStarted: 2022,
      status: 'active',
      description: 'Expansión regional cerca de Kist con alta demanda',
      keyProjects: ['Centro Ochsenfurt', 'FTTH Residencial', 'Red Empresarial Main']
    },
    {
      id: 'bavaria-munich-area',
      name: 'Bayern - Área Munich',
      city: 'Unterschleißheim',
      coordinates: { x: 50, y: 75 },
      projects: 14,
      clients: 2340,
      fiberBlown: '387 km',
      activations: 987,
      yearStarted: 2023,
      status: 'active',
      description: 'Proyectos metropolitanos de Munich con alta densidad',
      keyProjects: ['Metro Norte Munich', 'FTTH Unterschleißheim', 'Conexión Aeropuerto']
    },
    {
      id: 'lower-saxony-ossberg',
      name: 'Niedersachsen - Ossberg',
      city: 'Ossberg',
      coordinates: { x: 40, y: 45 },
      projects: 5,
      clients: 480,
      fiberBlown: '98 km',
      activations: 186,
      yearStarted: 2023,
      status: 'completed',
      description: 'Pequeña comunidad rural con proyecto piloto exitoso',
      keyProjects: ['Rural Ossberg', 'FTTH Comunitario', 'Red Agrícola']
    },
    {
      id: 'lower-saxony-rosdorf',
      name: 'Niedersachsen - Rosdorf',
      city: 'Rosdorf',
      coordinates: { x: 42, y: 48 },
      projects: 8,
      clients: 1150,
      fiberBlown: '212 km',
      activations: 428,
      yearStarted: 2023,
      status: 'active',
      description: 'Área de Göttingen con crecimiento tecnológico sostenido',
      keyProjects: ['FTTH Rosdorf', 'Campus Universitario', 'Red Científica']
    },
    {
      id: 'lower-saxony-bremen-area',
      name: 'Niedersachsen - Área Bremen',
      city: 'Lilienthal',
      coordinates: { x: 35, y: 32 },
      projects: 10,
      clients: 1680,
      fiberBlown: '298 km',
      activations: 612,
      yearStarted: 2023,
      status: 'active',
      description: 'Expansión metropolitana de Bremen con alta demanda',
      keyProjects: ['Metro Bremen Norte', 'FTTH Lilienthal', 'Conexión Aeroportuaria']
    },
    {
      id: 'hesse-frankfurt-area',
      name: 'Hessen - Área Frankfurt',
      city: 'Dreieich',
      coordinates: { x: 40, y: 64 },
      projects: 16,
      clients: 2780,
      fiberBlown: '445 km',
      activations: 1245,
      yearStarted: 2022,
      status: 'active',
      description: 'Zona metropolitana de Frankfurt con proyectos de alta complejidad',
      keyProjects: ['Metro Sur Frankfurt', 'FTTH Dreieich', 'Conexión Financiera', 'Data Center Rhine-Main']
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6 } 
    }
  };

  const mapVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'planning': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return t('mapStatusActive');
      case 'completed': return t('mapStatusCompleted');
      case 'planning': return t('mapStatusPlanning');
      default: return status;
    }
  };

  return (
    <section id="map" className={styles.mapSection}>
      <div className={styles.container}>
        <motion.div
          className={styles.titleContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px 0px" }}
        >
          <motion.div 
            className={styles.titleAccent} 
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 1, ease: "easeOut" }
              }
            }}
          />
          <motion.div 
            className={styles.titleAccent} 
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 1, ease: "easeOut", delay: 0.1 }
              }
            }}
          />
          <motion.div 
            className={styles.titleAccent} 
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 1, ease: "easeOut", delay: 0.2 }
              }
            }}
          />

          <motion.h2
            className={styles.title}
            variants={{
              hidden: { opacity: 0, y: -30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  ease: "easeOut"
                }
              }
            }}
          >
            {t('mapTitle')}
          </motion.h2>

          <motion.div
            className={styles.titleUnderline}
            variants={{
              hidden: { opacity: 0, scaleX: 0 },
              visible: {
                opacity: 1,
                scaleX: 1,
                transition: {
                  duration: 0.8,
                  ease: "easeOut",
                  delay: 0.1
                }
              }
            }}
          />

          <motion.p
            className={styles.titleSubtext}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  ease: "easeOut",
                  delay: 0.2
                }
              }
            }}
          >
            {t('mapSubtitle')}
          </motion.p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          className={styles.statsGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          <motion.div 
            className={styles.serviceCard}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                  <MapPin size={40} className={styles.serviceIcon} />
                </div>
                <h3 className={styles.title}>{t('mapRegionsLabel')}</h3>
              </div>
              <div className={styles.statNumber}>
                <AnimatedCounter end={workRegions.length} />
              </div>
            </div>
            <div className={styles.cardGlow}></div>
          </motion.div>
          
          <motion.div 
            className={styles.serviceCard}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                  <CheckCircle size={40} className={styles.serviceIcon} />
                </div>
                <h3 className={styles.title}>{t('mapProjectsLabel')}</h3>
              </div>
              <div className={styles.statNumber}>
                <AnimatedCounter end={workRegions.reduce((sum, region) => sum + region.projects, 0)} />
              </div>
            </div>
            <div className={styles.cardGlow}></div>
          </motion.div>
          
          <motion.div 
            className={styles.serviceCard}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                  <Users size={40} className={styles.serviceIcon} />
                </div>
                <h3 className={styles.title}>{t('mapClientsLabel')}</h3>
              </div>
              <div className={styles.statNumber}>
                <AnimatedCounter end={workRegions.reduce((sum, region) => sum + region.clients, 0)} />
              </div>
            </div>
            <div className={styles.cardGlow}></div>
          </motion.div>
          
          <motion.div 
            className={styles.serviceCard}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                  <Cable size={40} className={styles.serviceIcon} />
                </div>
                <h3 className={styles.title}>{t('mapFiberBlownLabel')}</h3>
              </div>
              <div className={styles.statNumber}>
                <AnimatedCounter end={workRegions.reduce((sum, region) => sum + parseInt(region.fiberBlown.replace(' km', '')), 0)} suffix=" km" />
              </div>
            </div>
            <div className={styles.cardGlow}></div>
          </motion.div>
          
          <motion.div 
            className={styles.serviceCard}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                  <Zap size={40} className={styles.serviceIcon} />
                </div>
                <h3 className={styles.title}>{t('mapActivationsLabel')}</h3>
              </div>
              <div className={styles.statNumber}>
                <AnimatedCounter end={workRegions.reduce((sum, region) => sum + region.activations, 0)} />
              </div>
            </div>
            <div className={styles.cardGlow}></div>
          </motion.div>
          
          <motion.div 
            className={styles.serviceCard}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                  <Calendar size={40} className={styles.serviceIcon} />
                </div>
                <h3 className={styles.title}>{t('mapSinceLabel')}</h3>
              </div>
              <div className={styles.statNumber}>
                <AnimatedCounter end={2021} />
              </div>
            </div>
            <div className={styles.cardGlow}></div>
          </motion.div>
        </motion.div>

        {/* Coverage Section */}
        <div className={styles.coverageSection}>
          <div className={styles.sectionTitle}>
            <h3>{t('mapCoverageTitle')}</h3>
            <p>{t('mapCoverageDescription')}</p>
          </div>
          
          <motion.div
            className={styles.coverageGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            <motion.div 
              className={styles.serviceCard}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconContainer}>
                    <span className={styles.countryFlag}>🇩🇪</span>
                  </div>
                  <h3 className={styles.title}>{t('mapGermanyTitle')}</h3>
                </div>
                <p className={styles.description}>{t('mapGermanyDesc')}</p>
              </div>
              <div className={styles.cardGlow}></div>
            </motion.div>
            
            <motion.div 
              className={styles.serviceCard}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconContainer}>
                    <span className={styles.countryFlag}>🇪🇸</span>
                  </div>
                  <h3 className={styles.title}>{t('mapSpainTitle')}</h3>
                </div>
                <p className={styles.description}>{t('mapSpainDesc')}</p>
              </div>
              <div className={styles.cardGlow}></div>
            </motion.div>
            
            <motion.div 
              className={styles.serviceCard}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconContainer}>
                    <span className={styles.countryFlag}>🇦🇹</span>
                  </div>
                  <h3 className={styles.title}>{t('mapAustriaTitle')}</h3>
                </div>
                <p className={styles.description}>{t('mapAustriaDesc')}</p>
              </div>
              <div className={styles.cardGlow}></div>
            </motion.div>
          </motion.div>
        </div>

        {/* Active Region Details */}
        {activeRegion && (
          <motion.div
            className={styles.regionDetails}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.detailsHeader}>
              <h3>{activeRegion.name}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setActiveRegion(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.detailsContent}>
              <p className={styles.description}>{activeRegion.description}</p>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>{t('mapCityLabel')}:</span>
                  <span className={styles.value}>{activeRegion.city}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>{t('mapProjectsLabel')}:</span>
                  <span className={styles.value}>{activeRegion.projects}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>{t('mapClientsLabel')}:</span>
                  <span className={styles.value}>{activeRegion.clients.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>{t('mapFiberBlownLabel')}:</span>
                  <span className={styles.value}>{activeRegion.fiberBlown}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>{t('mapActivationsLabel')}:</span>
                  <span className={styles.value}>{activeRegion.activations.toLocaleString()}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>{t('mapYearStartedLabel')}:</span>
                  <span className={styles.value}>{activeRegion.yearStarted}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>{t('mapStatusLabel')}:</span>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(activeRegion.status) }}
                  >
                    {getStatusText(activeRegion.status)}
                  </span>
                </div>
              </div>
              
              {/* Key Projects */}
              <div className={styles.keyProjects}>
                <h4>{t('mapKeyProjects')}</h4>
                <div className={styles.projectsList}>
                  {activeRegion.keyProjects.map((project, index) => (
                    <motion.div
                      key={index}
                      className={styles.projectItem}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <div className={styles.projectIcon}>
                        <div className={styles.projectDot}></div>
                      </div>
                      <span>{project}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </section>
  );
};

export default Map;