
import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02,
    },
  };

  // FIX: Added 'as const' to ensure TypeScript infers the 'type' property as the literal 'spring', not the general 'string' type, which resolves the framer-motion Transition type error.
  const pageTransition = {
    type: 'spring',
    stiffness: 260,
    damping: 25,
  } as const;

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
