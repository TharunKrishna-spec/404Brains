import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxX = typeof window !== 'undefined' ? (mousePos.x - window.innerWidth / 2) / 40 : 0;
  const parallaxY = typeof window !== 'undefined' ? (mousePos.y - window.innerHeight / 2) / 40 : 0;

  return (
    <div className="min-h-screen w-full bg-black text-white font-rajdhani">
      <div 
        className="animated-background transition-transform duration-500 ease-out" 
        style={{ transform: `translate(${parallaxX}px, ${parallaxY}px)` }}
      >
        <div className="blob one"></div>
        <div className="blob two"></div>
        <div className="blob three"></div>
      </div>
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;