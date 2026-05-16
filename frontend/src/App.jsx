import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import RoleSelection from './pages/RoleSelection'; 
import Login from './pages/Login';
import Layout from './pages/Layout';
import SecretaryLayout from './pages/SecretaryLayout';     // ← NOUVEAU
import Dashboard from './pages/Dashboard';
import TechLogin from './pages/TechLogin';
import TechDashboard from './pages/TechDashboard';
import Patients from './pages/Patients';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import SecretaryDashboard from './pages/SecretaryDashboard';
import PatientLanding from './pages/PatientLanding';
import PatientSignup from './pages/PatientSignup';
import useAuthStore from './store/authStore';
import Consultation from './pages/Consultation';
import EmailActivation from './pages/EmailActivation';
import { GlobalUI } from './components/GlobalUI';

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // ✅ AJOUT : Écouter les messages depuis l'iframe de téléconsultation
  useEffect(() => {
    const handleTeleconsultMessage = (event) => {
      // Vérifier l'origine du message (sécurité)
      if (event.origin !== 'http://localhost:5000') return;
      
      if (event.data && event.data.type === 'END_CONSULTATION') {
        // Rediriger vers le dashboard du médecin
        navigate('/dashboard');
        // Optionnel : rafraîchir les données de l'agenda
        // Vous pouvez ajouter un event personnalisé ou un callback ici
        window.dispatchEvent(new CustomEvent('refreshAppointments'));
      }
      
      // ✅ AJOUT : Gérer la demande de création d'ordonnance
      if (event.data && event.data.type === 'CREATE_PRESCRIPTION') {
        // Rediriger vers la consultation pour créer l'ordonnance
        const { rdvId } = event.data;
        if (rdvId) {
          navigate(`/consultation/${rdvId}?tab=prescription`);
        }
      }
    };
    
    window.addEventListener('message', handleTeleconsultMessage);
    return () => window.removeEventListener('message', handleTeleconsultMessage);
  }, [navigate]);

  // ✅ AJOUT : Écouter l'événement personnalisé pour rafraîchir les RDV
  useEffect(() => {
    const handleRefresh = () => {
      // Déclencher un rafraîchissement des appointments
      // Vous pouvez appeler votre store ici
      if (window.refreshAppointmentsCallback) {
        window.refreshAppointmentsCallback();
      }
    };
    
    window.addEventListener('refreshAppointments', handleRefresh);
    return () => window.removeEventListener('refreshAppointments', handleRefresh);
  }, []);

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
    <>
      <GlobalUI />
      <Routes>
        {/* 1. PAGES PUBLIQUES */}
        <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<RoleSelection />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/tech-ops" element={<TechLogin />} />

      {/* === ROUTES ESPACE PATIENT === */}
      <Route path="/patient" element={<PatientLanding />} />
      <Route path="/patient/signup" element={<PatientSignup />} />

      <Route path="/consultation/:rdvId" element={<Layout><Consultation /></Layout>} />
      <Route path="/activate/:uidb64/:token" element={<EmailActivation />} />
      
      {/* 2. DASHBOARD PRINCIPAL (Dynamique selon le rôle) */}
      <Route 
        path="/dashboard" 
        element={
          !isAuthenticated ? (
            <Navigate to="/connexion" />
          ) : user?.role === 'SECRETAIRE' ? (
            <SecretaryLayout><SecretaryDashboard /></SecretaryLayout>   // ← CHANGÉ
          ) : user?.role === 'MEDECIN' ? (
            <Layout><Dashboard /></Layout>
          ) : (
            <Navigate to="/connexion" />
          )
        } 
      />

      {/* 3. GESTION DES PATIENTS (Staff médical) */}
      <Route 
        path="/patients" 
        element={
          isAuthenticated && (user?.role === 'MEDECIN' || user?.role === 'SECRETAIRE') ? (
            user?.role === 'SECRETAIRE' ? (
              <SecretaryLayout><Patients /></SecretaryLayout>            // ← CHANGÉ
            ) : (
              <Layout><Patients /></Layout>
            )
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
            <PatientDashboard /> 
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
    </>
  );
}

export default App;