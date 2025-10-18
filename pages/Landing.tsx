
import React from 'react';
import AnimatedLogo from '../components/AnimatedLogo';
import GlowingButton from '../components/GlowingButton';
import PageTransition from '../components/PageTransition';
import { motion } from 'framer-motion';

// --- CUSTOMIZE YOUR DEMO IMAGES HERE ---
// You can replace the links below with direct links to your own images.
// These will be displayed at the top of the page as sponsor/club logos.
const demoImages = [
  'https://picsum.photos/seed/cyberpunk/200', // Replace with your image link
  'https://picsum.photos/seed/matrix/200',    // Replace with your image link
  'https://picsum.photos/seed/code/200',      // Replace with your image link
  'https://picsum.photos/seed/network/200',   // Replace with your image link
  'https://picsum.photos/seed/tech/200',      // Replace with your image link
  'https://picsum.photos/seed/future/200'     // Replace with your image link
];

const imageContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

const LandingPage: React.FC = () => {
  return (
    <PageTransition>
      {/* A wrapper is needed to contain both absolute and static elements */}
      <div className="w-full">
        
        {/* Logos are positioned absolutely at the top of the nearest relative container (the 'main' tag in Layout.tsx) */}
        <motion.div
          className="absolute top-4 left-0 right-0 mx-auto flex justify-center items-center flex-wrap gap-8 md:gap-12 px-4"
          variants={imageContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {demoImages.map((src, index) => (
            <motion.div key={index} variants={imageVariants}>
              <img 
                src={src} 
                alt={`Sponsor or club logo ${index + 1}`}
                className="w-20 h-20 md:w-24 md:h-24 object-contain" 
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* The main content remains vertically centered by the parent Layout component */}
        <div className="flex flex-col items-center justify-center space-y-12">
          <AnimatedLogo />
          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
            <GlowingButton to="/team-login">Team Login</GlowingButton>
            <GlowingButton to="/admin-login" className="!border-[#00eaff] group-hover:!bg-[#00eaff]">Admin Login</GlowingButton>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default LandingPage;