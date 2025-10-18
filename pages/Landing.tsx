import React from 'react';
import AnimatedLogo from '../components/AnimatedLogo';
import GlowingButton from '../components/GlowingButton';
import PageTransition from '../components/PageTransition';

const LandingPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center space-y-12">
        <AnimatedLogo />

        <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
          <GlowingButton to="/team-login">Team Login</GlowingButton>
          <GlowingButton to="/admin-login" className="!border-[#00eaff] group-hover:!bg-[#00eaff]">Admin Login</GlowingButton>
        </div>
      </div>
    </PageTransition>
  );
};

export default LandingPage;