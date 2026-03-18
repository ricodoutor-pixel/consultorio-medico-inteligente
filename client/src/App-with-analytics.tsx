/**
 * APP.TSX COM GOOGLE ANALYTICS INTEGRADO
 * Rastreamento completo de todas as atividades
 * 
 * Data: 09/03/2026
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { googleAnalytics, usePageTracking, useUserTracking } from './lib/google-analytics';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Consultations from './pages/Consultations';
import Doctors from './pages/Doctors';
import About from './pages/About';

function App() {
  const { user } = useAuth();

  // Inicializar Google Analytics
  useEffect(() => {
    googleAnalytics.initialize();
  }, []);

  // Rastrear usuário
  useUserTracking(user?.id || null, {
    type: user?.role || 'guest',
    email: user?.email || 'anonymous'
  });

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeWithTracking />} />
        <Route path="/dashboard" element={<DashboardWithTracking />} />
        <Route path="/consultations" element={<ConsultationsWithTracking />} />
        <Route path="/doctors" element={<DoctorsWithTracking />} />
        <Route path="/about" element={<AboutWithTracking />} />
      </Routes>
    </Router>
  );
}

// ============================================================================
// PÁGINAS COM RASTREAMENTO
// ============================================================================

function HomeWithTracking() {
  usePageTracking('Home');
  return <Home />;
}

function DashboardWithTracking() {
  usePageTracking('Dashboard');
  return <Dashboard />;
}

function ConsultationsWithTracking() {
  usePageTracking('Consultations');
  return <Consultations />;
}

function DoctorsWithTracking() {
  usePageTracking('Doctors');
  return <Doctors />;
}

function AboutWithTracking() {
  usePageTracking('About');
  return <About />;
}

export default App;
