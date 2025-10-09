import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import styles from './ServiceCard.module.scss';

const ServiceCard = ({ title, description, tasks, icon: IconComponent }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px 0px" });

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [controls, isInView]);

    const cardVariants = {
        hidden: { 
            opacity: 0, 
            y: 50, 
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.8,
                type: "spring",
                stiffness: 100,
                damping: 15,
                ease: "easeOut"
            }
        }
    };

    const iconVariants = {
        hidden: { 
            scale: 0.5, 
            opacity: 0
        },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                delay: 0.3,
                duration: 0.8,
                type: "spring",
                stiffness: 150,
                damping: 12,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            ref={ref}
            className={styles.card}
            variants={cardVariants}
            initial="hidden"
            animate={controls}
            whileHover={{
                y: -15,
                scale: 1.02,
                boxShadow: "0px 20px 40px rgba(99, 102, 241, 0.6)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className={styles.cardContent}>
                <header className={styles.cardHeader}>
                    {IconComponent && (
                        <motion.div
                            className={styles.iconContainer}
                            variants={iconVariants}
                            initial="hidden"
                            animate={controls}
                        >
                            <IconComponent size={40} className={styles.serviceIcon} />
                        </motion.div>
                    )}
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        margin: '0',
                        letterSpacing: '-0.025em',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        textAlign: 'center'
                    }}>{title}</h3>
                </header>

                <p style={{
                    color: 'rgba(156, 163, 175, 0.9)',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    textAlign: 'center',
                    fontWeight: '400',
                    marginBottom: '1rem'
                }}>{description}</p>

                {tasks && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        padding: '1.25rem',
                        background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.5))',
                        borderRadius: '1rem',
                        border: '1px solid rgba(20, 184, 166, 0.2)',
                        marginTop: '1rem'
                    }}>
                        {tasks.split('\n').map((task, index) => (
                            <div 
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.25rem 0'
                                }}
                            >
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #2dd4bf, #38bdf8)',
                                    marginTop: '0.5rem',
                                    flexShrink: 0
                                }}></div>
                                <span style={{ 
                                    color: '#ffffff',
                                    fontWeight: '500',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.6',
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
                                }}>
                                    {task.replace('• ', '')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className={styles.cardGlow}></div>
        </motion.div>
    );
};

export default ServiceCard;