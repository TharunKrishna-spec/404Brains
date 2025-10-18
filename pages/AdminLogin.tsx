
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GlowingButton from '../components/GlowingButton';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../hooks/useAuth';

const AdminLoginPage: React.FC = () => {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await loginAsAdmin(email, password);
    if (success) {
      navigate('/admin-dashboard');
    } else {
      setError('Invalid admin credentials or error logging in.');
    }
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <h1 className="text-5xl font-orbitron font-bold mb-8 text-glow-blue">Admin Portal</h1>
        <form onSubmit={handleLogin} className="w-full p-8 space-y-6 bg-black bg-opacity-50 border-2 border-[#00eaff] rounded-lg shadow-2xl shadow-[#00eaff]/20">
          <div className="relative">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full px-4 py-3 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] focus:ring-1 focus:ring-[#00eaff] placeholder-gray-500" />
          </div>
          <div className="relative">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full px-4 py-3 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] focus:ring-1 focus:ring-[#00eaff] placeholder-gray-500" />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <GlowingButton type="submit" className="w-full !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={loading}>
             Login
          </GlowingButton>
           <div className="text-center mt-4">
             <Link to="/" className="text-sm text-gray-400 hover:text-[#00eaff] hover:underline transition-colors">
                &larr; Back to Home
             </Link>
           </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default AdminLoginPage;