import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface GlowingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const GlowingButton: React.FC<GlowingButtonProps> = ({ children, onClick, to, className = '', type = 'button', disabled = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
    }
    if (to) {
      navigate(to);
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-black border-2 border-[#ff7b00] rounded-md group font-orbitron uppercase tracking-widest ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-[#ff7b00] rounded-full group-hover:w-56 group-hover:h-56"></span>
      <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out opacity-0 group-hover:opacity-100" style={{ boxShadow: '0 0 10px #ff7b00, 0 0 20px #ff7b00, 0 0 30px #ff7b00' }}></span>
      <span className="relative">{children}</span>
    </motion.button>
  );
};

export default GlowingButton;
