
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface LayoutProps {
  children: React.ReactNode;
}

// Type for click-generated waves
interface ClickWave {
  id: string;
  x: number;
  y: number;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clickWaves, setClickWaves] = useState<ClickWave[]>([]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const handleLayoutClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Prevent creating waves when clicking on interactive elements like buttons
    if ((event.target as HTMLElement).closest('button, a, input')) {
        return;
    }
      
    const newWave: ClickWave = {
      id: uuidv4(),
      x: event.clientX,
      y: event.clientY,
    };

    setClickWaves(prevWaves => [...prevWaves, newWave]);

    // Cleanup the wave after the animation duration from CSS (1500ms)
    setTimeout(() => {
      setClickWaves(prevWaves => prevWaves.filter(wave => wave.id !== newWave.id));
    }, 1500);
  };

  const parallaxX = typeof window !== 'undefined' ? (mousePos.x - window.innerWidth / 2) / 40 : 0;
  const parallaxY = typeof window !== 'undefined' ? (mousePos.y - window.innerHeight / 2) / 40 : 0;
  
  // CSS variables for the spotlight effect, passed via inline style
  const spotlightStyle: React.CSSProperties = {
    '--mouse-x': `${mousePos.x}px`,
    '--mouse-y': `${mousePos.y}px`,
  } as React.CSSProperties;

  return (
    <div 
        className="min-h-screen w-full bg-black text-white font-rajdhani"
        onClick={handleLayoutClick}
    >
      <div 
        className="animated-background transition-transform duration-500 ease-out" 
        style={{ transform: `translate(${parallaxX}px, ${parallaxY}px)` }}
      >
        {/* The grid is handled by ::before, scanlines by ::after */}

        {/* Mouse-tracking spotlight */}
        <div id="cursor-spotlight" style={spotlightStyle}></div>
        
        {/* Rising embers/sparks */}
        <div className="particle-container">
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>

        {/* Render click-generated waves */}
        {clickWaves.map(wave => (
          <div
            key={wave.id}
            className="click-wave"
            style={{
              top: `${wave.y}px`,
              left: `${wave.x}px`,
            }}
          />
        ))}
        
      </div>
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;