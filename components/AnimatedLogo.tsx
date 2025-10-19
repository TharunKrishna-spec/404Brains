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
  const title = "404: Clue Not Found";
  const tagline = "VOICE-IT - FEEL THE RHYTHM";

  return (
    <div className="text-center">
      {/* Wrapper div for glitch effect on hover */}
      <div className="glitch-effect" data-text={title}>
        <motion.h1
          className="font-orbitron text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-widest text-glow-blue"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          aria-label={title}
        >
          {title.split("").map((char, index) => (
            <motion.span key={index} variants={letterVariants} className="inline-block">
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>
      </div>

      {/* Re-integrated tagline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.5 } }}
        className="font-rajdhani text-lg md:text-xl text-[#ff7b00] uppercase tracking-[0.2em] text-glow mt-4"
      >
        {tagline}
      </motion.p>
    </div>
  );
};

export default AnimatedLogo;