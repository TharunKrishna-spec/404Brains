import React from 'react';
import AnimatedLogo from './AnimatedLogo';

interface FullScreenLoaderProps {
  text: string;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <AnimatedLogo />
      <p className="text-2xl font-orbitron text-glow-blue animate-pulse">{text}</p>
    </div>
  );
};

export default FullScreenLoader;