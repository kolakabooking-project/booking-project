import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './MyJourneyTracker.css';

/* ── Shared Animations ── */

const cardVariants = {
  expanded: { 
    opacity: 1, 
    height: 'auto', 
    paddingTop: '0.875rem', 
    paddingBottom: '0.875rem',
    transitionEnd: { overflow: 'visible' }
  },
  collapsed: { 
    opacity: 0, 
    height: 0, 
    paddingTop: 0, 
    paddingBottom: 0,
    overflow: 'hidden'
  },
};

const iconVariants = {
  expanded: { opacity: 1, scale: 1, rotateY: 0 },
  collapsed: { opacity: 0, scale: 0.2, rotateY: -90 },
};

const countVariants = {
  expanded: { opacity: 0, scale: 0.2, rotateY: 90 },
  collapsed: { opacity: 1, scale: 1, rotateY: 0 },
};

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

export default function JourneyTracker({ config }) {
  const { title, toggleButtonClass, checkpoints } = config;
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`mjt-root ${!isExpanded ? 'mjt-root--collapsed' : ''}`}>
      {/* Toggle */}
      <button
        className={`mjt-toggle-btn ${toggleButtonClass || ''}`}
        onClick={() => setIsExpanded((v) => !v)}
        type="button"
        aria-expanded={isExpanded}
      >
        <span className="mjt-toggle-text">{title}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <div className="mjt-scroll-wrapper">
        <div className="mjt-track">
          {checkpoints.map((cp, index) => {
            const isLast = index === checkpoints.length - 1;

            return (
              <React.Fragment key={cp.id}>
                <div className={`mjt-checkpoint ${cp.checkpointClass || ''}`}>
                  <div className={`mjt-node ${cp.nodeClass || ''}`}>
                    {cp.type === 'static' ? (
                      <span className={`mjt-node-icon ${cp.iconClass || ''}`}>
                        <cp.icon />
                      </span>
                    ) : (
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.span
                          className={`mjt-node-icon ${cp.iconClass || ''}`}
                          style={{ position: 'absolute' }}
                          variants={iconVariants}
                          initial="expanded"
                          animate={isExpanded ? 'expanded' : 'collapsed'}
                          transition={{ duration: 0.3 }}
                        >
                          <cp.icon />
                        </motion.span>
                        <motion.span
                          className={`mjt-node-count ${cp.countClass || ''}`}
                          style={{ position: 'absolute' }}
                          variants={countVariants}
                          initial="collapsed"
                          animate={isExpanded ? 'expanded' : 'collapsed'}
                          transition={{ duration: 0.3 }}
                        >
                          {cp.count}
                        </motion.span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        variants={cardVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className={`mjt-checkpoint-card ${cp.cardClass || ''}`}
                        onClick={cp.onClick}
                        role={cp.onClick ? "button" : undefined}
                        tabIndex={cp.onClick ? 0 : undefined}
                      >
                        {cp.renderCardContent()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!isLast && (
                  <motion.div 
                    className={`mjt-road ${cp.roadClass || ''}`} 
                    animate={{ width: isExpanded ? 48 : 32 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
