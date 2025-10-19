import React from 'react';
import AnimatedLogo from '../components/AnimatedLogo';
import GlowingButton from '../components/GlowingButton';
import PageTransition from '../components/PageTransition';
import { VOICE_IT_LOGO } from '../assets/images';

const LandingPage: React.FC = () => {
  return (
    <PageTransition>
      {/* This container counteracts Layout's padding and fills the screen, becoming the new layout root */}
      <div className="flex flex-col items-center w-full min-h-screen -my-4">
        
        {/* Part 1: Logo at the top, with its own padding */}
        <div className="pt-4">
             <img 
              src={VOICE_IT_LOGO} 
              alt="Voice-It Club Logo" 
              className="w-24 h-24 holographic-image"
            />
        </div>
        
        {/* Part 2: Centered content that fills the remaining space */}
        <div className="flex flex-col items-center justify-center flex-grow">
            <div className="my-4">
              <AnimatedLogo />
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8 mt-12">
                <GlowingButton to="/team-login">Team Login</GlowingButton>
                <GlowingButton to="/admin-login" className="!border-[#00eaff] group-hover:!bg-[#00eaff]">Admin Login</GlowingButton>
            </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default LandingPage;