import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    // FIX: Added 'as const' to the transition object. This tells TypeScript to infer 'type' as the literal 'spring' instead of the generic 'string', satisfying framer-motion's strict Transition type.
    transition: {
      type: 'spring',
      stiffness: 120,
    } as const,
  },
};

const AnimatedLogo: React.FC = () => {
  const mainTitle = "404";
  const subtitle = "Clue Not Found";
  const tagline = "VOICE-IT - FEEL THE RHYTHM";

  return (
    <div className="text-center">
      {/* Wrapper div for glitch effect on hover */}
      <div className="glitch-effect" data-text={mainTitle}>
        <motion.h1
          className="font-orbitron text-6xl sm:text-7xl md:text-9xl lg:text-[10rem] font-black text-white uppercase tracking-widest text-glow-blue leading-none"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          aria-label={mainTitle}
        >
          {mainTitle.split("").map((char, index) => (
            <motion.span key={index} variants={letterVariants} className="inline-block">
              {char}
            </motion.span>
          ))}
        </motion.h1>
      </div>

      {/* Subtitle */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }}
        className="font-orbitron text-xl sm:text-2xl md:text-4xl font-bold text-white uppercase tracking-[0.2em] text-glow-blue -mt-1 md:-mt-2"
      >
        {subtitle}
      </motion.h2>


      {/* Re-integrated tagline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.7 } }}
        className="font-rajdhani text-lg md:text-xl text-[#ff7b00] uppercase tracking-[0.2em] text-glow mt-8"
      >
        {tagline}
      </motion.p>
    </div>
  );
};

export default AnimatedLogo;