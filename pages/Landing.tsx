import React from 'react';
import AnimatedLogo from '../components/AnimatedLogo';
import GlowingButton from '../components/GlowingButton';
import PageTransition from '../components/PageTransition';
import { VOICE_IT_LOGO, SPONSOR_LOGO_1, SPONSOR_LOGO_2, SPONSOR_LOGO_3, SPONSOR_LOGO_4 } from '../assets/images';

const LandingPage: React.FC = () => {
  return (
    <PageTransition>
      {/* This container counteracts Layout's padding and fills the screen, becoming the new layout root */}
      <div className="flex flex-col items-center w-full min-h-screen -my-4">
        
        {/* Part 1: Header with logos */}
        <header className="w-full flex justify-center items-center p-2 sm:p-4">
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
                {/* Main Logo */}
                <img 
                  src={VOICE_IT_LOGO} 
                  alt="Voice-It Club Logo" 
                  className="w-20 h-20 sm:w-24 sm:h-24 holographic-image"
                />
                
                {/* Sponsor Logos */}
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
                    <img src={SPONSOR_LOGO_1} alt="Sponsor 1" className="w-16 h-16 sm:w-20 sm:h-20 object-contain holographic-image" style={{ animationDelay: '0.1s' }} />
                    <img src={SPONSOR_LOGO_2} alt="Sponsor 2" className="w-16 h-16 sm:w-20 sm:h-20 object-contain holographic-image" style={{ animationDelay: '0.2s' }} />
                    <img src={SPONSOR_LOGO_3} alt="Sponsor 3" className="w-16 h-16 sm:w-20 sm:h-20 object-contain holographic-image" style={{ animationDelay: '0.3s' }} />
                    <img src={SPONSOR_LOGO_4} alt="Sponsor 4" className="w-16 h-16 sm:w-20 sm:h-20 object-contain holographic-image" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        </header>
        
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