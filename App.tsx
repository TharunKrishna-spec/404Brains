

import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/Landing';
import AdminLoginPage from './pages/AdminLogin';
import TeamLoginPage from './pages/TeamLogin';
import AdminDashboardPage from './pages/AdminDashboard';
import TeamDashboardPage from './pages/TeamDashboard';
import LeaderboardPage from './pages/Leaderboard';
import Layout from './components/Layout';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import FullScreenLoader from './components/FullScreenLoader';

const AnimatedRoutes: React.FC = () => {
    const location = useLocation();
    const { user, isAdmin } = useAuth();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin-login" element={user ? <Navigate to="/admin-dashboard" /> : <AdminLoginPage />} />
                <Route path="/team-login" element={user ? <Navigate to="/team-dashboard" /> : <TeamLoginPage />} />
                
                <Route 
                    path="/admin-dashboard" 
                    element={
                        <ProtectedRoute adminRequired={true}>
                            <AdminDashboardPage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/team-dashboard" 
                    element={
                        <ProtectedRoute>
                            <TeamDashboardPage />
                        </ProtectedRoute>
                    } 
                />

                <Route path="/leaderboard" element={<LeaderboardPage />} />

                {/* Redirect authenticated users from landing page */}
                {user && location.pathname === '/' && (
                    <Route path="/" element={<Navigate to={isAdmin ? "/admin-dashboard" : "/team-dashboard"} />} />
                )}
            </Routes>
        </AnimatePresence>
    );
};

const App: React.FC = () => {
  const { loading } = useAuth();

  // FIX: Centralize Layout and use a ternary for conditional rendering.
  // This ensures a consistent component structure and fixes the type error.
  return (
    <Layout>
      {loading ? (
        <FullScreenLoader text="Initializing Session..." />
      ) : (
        <HashRouter>
          <AnimatedRoutes />
        </HashRouter>
      )}
    </Layout>
  );
};

export default App;