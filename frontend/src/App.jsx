import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import RoleSelection from './pages/RoleSelection'; 
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import TechLogin from './pages/TechLogin';
import TechDashboard from './pages/TechDashboard';
import Patients from './pages/Patients';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import SecretaryDashboard from './pages/SecretaryDashboard';
import useAuthStore from './store/authStore';
import Consultation from './pages/Consultation';
function App() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 't') {
        navigate('/tech-ops');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <Routes>
      {/* 1. PAGES PUBLIQUES */}
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<RoleSelection />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/tech-ops" element={<TechLogin />} />
      <Route path="/consultation/:rdvId" element={<Layout><Consultation /></Layout>} />

      {/* 2. LE DASHBOARD PRINCIPAL (Dynamique selon le rôle) */}
      <Route 
        path="/dashboard" 
        element={
          !isAuthenticated ? (
            <Navigate to="/connexion" />
          ) : user?.role === 'SECRETAIRE' ? (
            <Layout><SecretaryDashboard /></Layout>
          ) : user?.role === 'MEDECIN' ? (
            <Layout><Dashboard /></Layout>
          ) : (
            <Navigate to="/connexion" />
          )
        } 
      />

      {/* 3. GESTION DES PATIENTS (Accessible au staff médical) */}
      <Route 
        path="/patients" 
        element={
          isAuthenticated && (user?.role === 'MEDECIN' || user?.role === 'SECRETAIRE') ? (
            <Layout><Patients /></Layout>
          ) : (
            <Navigate to="/connexion" />
          )
        } 
      />

      {/* 4. ESPACE PATIENT (Isolé) */}
      <Route 
        path="/patient-dashboard" 
        element={
          isAuthenticated && user?.role === 'PATIENT' ? (
            <div className="min-h-screen bg-[#020617] p-10"><PatientDashboard /></div>
          ) : (
            <Navigate to="/login?role=PATIENT" />
          )
        } 
      />

      {/* 5. ESPACE TECHNIQUE (Admin uniquement) */}
      <Route 
        path="/tech-dashboard" 
        element={
          isAuthenticated && user?.role === 'ADMIN' ? (
            <TechDashboard />
          ) : (
            <Navigate to="/tech-ops" />
          )
        } 
      />

      {/* 6. REDIRECTION PAR DÉFAUT */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;