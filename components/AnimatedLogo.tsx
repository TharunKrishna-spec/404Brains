
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
    transition: {
      type: 'spring',
      stiffness: 120,
    },
  },
};

const taglineVariants = {
    hidden: { opacity: 0, y: 10},
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 1.5 } }
}

const AnimatedLogo: React.FC = () => {
  const title = "404: Clue Not Found";

  return (
    <div className="text-center">
      {/* NEW: Wrapper div for glitch effect on hover */}
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
      <motion.p 
        className="mt-4 font-rajdhani text-lg md:text-xl text-[#ff7b00] uppercase tracking-[0.2em] text-glow"
        variants={taglineVariants}
        initial="hidden"
        animate="visible"
        >
            Voice-It — Feel the Rhythm
      </motion.p>
    </div>
  );
};

export default AnimatedLogo;