
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedLogo from '../components/AnimatedLogo';
import GlowingButton from '../components/GlowingButton';
import PageTransition from '../components/PageTransition';
import RulesModal from '../components/RulesModal';
import { VOICE_IT_LOGO, SPONSOR_LOGO_1, SPONSOR_LOGO_2, SPONSOR_LOGO_3, SPONSOR_LOGO_4 } from '../assets/images';

// --- NEW: Icon components for social media links ---
const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);


const LandingPage: React.FC = () => {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  return (
    <PageTransition>
      {/* This container counteracts Layout's padding, fills the screen, and provides positioning context */}
      <div className="relative flex flex-col items-center w-full min-h-screen -my-4">
        
        {/* Part 1: Header with logos */}
        <header className="w-full flex justify-center items-center p-2 sm:p-4">
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
                {/* Left Sponsor Logos */}
                <img 
                    src={SPONSOR_LOGO_1} 
                    alt="Sponsor 1" 
                    className="w-16 h-16 sm:w-20 md:w-24 h-auto object-contain holographic-image transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                    style={{ animationDelay: '0.2s' }} 
                />
                <img 
                    src={SPONSOR_LOGO_2} 
                    alt="Sponsor 2" 
                    className="w-16 h-16 sm:w-20 md:w-24 h-auto object-contain holographic-image transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                    style={{ animationDelay: '0.3s' }} 
                />
                
                {/* Main Logo - Center */}
                <a 
                  href="https://www.instagram.com/voiceit_vitcc/"
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Visit our Instagram"
                  className="group"
                >
                  <img 
                    src={VOICE_IT_LOGO} 
                    alt="Voice-It Club Logo" 
                    className="w-20 h-20 sm:w-24 md:w-28 h-auto holographic-image transition-transform duration-300 group-hover:scale-110"
                  />
                </a>
                
                {/* Right Sponsor Logos */}
                <img 
                    src={SPONSOR_LOGO_3} 
                    alt="Sponsor 3" 
                    className="w-16 h-16 sm:w-20 md:w-24 h-auto object-contain holographic-image transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                    style={{ animationDelay: '0.2s' }} 
                />
                <img 
                    src={SPONSOR_LOGO_4} 
                    alt="Sponsor 4" 
                    className="w-16 h-16 sm:w-20 md:w-24 h-auto object-contain holographic-image transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                    style={{ animationDelay: '0.3s' }} 
                />
            </div>
        </header>
        
        {/* Part 2: Centered content that fills the remaining space */}
        <div className="flex flex-col items-center justify-center flex-grow">
            <div className="my-4">
              <AnimatedLogo />
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center">
                <GlowingButton to="/team-login" className="text-lg sm:text-xl px-10 sm:px-12 py-3 sm:py-4">
                    Get into our world
                </GlowingButton>
                <GlowingButton 
                  onClick={() => setIsRulesModalOpen(true)}
                  className="text-lg sm:text-xl px-10 sm:px-12 py-3 sm:py-4 !border-[#00eaff] group-hover:!bg-[#00eaff]"
                >
                    Rules
                </GlowingButton>
            </div>
        </div>
        
        {/* --- NEW: Social Media Links --- */}
        <div className="absolute bottom-6 left-6 flex items-center gap-4">
          <a 
            href="https://www.instagram.com/voiceit_vitcc/"
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Instagram"
            className="text-gray-400 hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_5px_#ff7b00]"
          >
            <InstagramIcon className="w-6 h-6" />
          </a>
          <a 
            href="https://www.linkedin.com/company/voice-it-club"
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="LinkedIn"
            className="text-gray-400 hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_5px_#00eaff]"
          >
            <LinkedInIcon className="w-6 h-6" />
          </a>
        </div>

        {/* Part 3: Admin Login Link in the corner */}
        <Link 
          to="/admin-login" 
          className="absolute bottom-6 right-6 text-sm text-gray-400 hover:text-[#00eaff] transition-colors font-orbitron tracking-wider glitch-effect"
          data-text="Admin Access"
        >
          Admin Access
        </Link>

      </div>

      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </PageTransition>
  );
};

export default LandingPage;