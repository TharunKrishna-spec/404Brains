
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GlowingButton from '../components/GlowingButton';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../hooks/useAuth';

const TeamLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await login(email, password);
    if (error) {
        setError(error.message);
    } else {
        navigate('/team-dashboard');
    }
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <h1 className="text-5xl font-orbitron font-bold mb-8 text-glow">Team Portal</h1>
        <form onSubmit={handleLogin} className="w-full p-8 space-y-6 bg-black bg-opacity-50 border-2 border-[#ff7b00] rounded-lg shadow-2xl shadow-[#ff7b00]/20">
          <div className="relative">
            <input 
              type="email" 
              placeholder="Team Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full px-4 py-3 bg-transparent border-2 border-[#ff7b00]/50 rounded-md focus:outline-none focus:border-[#ff7b00] focus:ring-1 focus:ring-[#ff7b00] placeholder-gray-500" />
          </div>
          <div className="relative">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full px-4 py-3 bg-transparent border-2 border-[#ff7b00]/50 rounded-md focus:outline-none focus:border-[#ff7b00] focus:ring-1 focus:ring-[#ff7b00] placeholder-gray-500" />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <GlowingButton type="submit" className="w-full" disabled={loading}>
             {loading ? 'Logging In...' : 'Login'}
          </GlowingButton>
           <div className="text-center mt-4">
             <Link to="/" className="text-sm text-gray-400 hover:text-[#ff7b00] hover:underline transition-colors">
                &larr; Back to Home
             </Link>
           </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default TeamLoginPage;
