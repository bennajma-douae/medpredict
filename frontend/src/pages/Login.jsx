import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Stethoscope, 
  UserCog, 
  Users, 
  ArrowLeft, 
  Lock, 
  User,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { toast } from '../store/uiStore';

const Login = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'MEDECIN'; 
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Configuration dynamique selon le rôle
  const configs = {
    MEDECIN: {
      title: "Espace Praticien",
      icon: Stethoscope,
      color: "text-blue-500",
      bg: "bg-blue-600",
      shadow: "shadow-blue-600/20",
      border: "focus:border-blue-500"
    },
    SECRETAIRE: {
      title: "Espace Secrétariat",
      icon: UserCog,
      color: "text-indigo-500",
      bg: "bg-indigo-600",
      shadow: "shadow-indigo-600/20",
      border: "focus:border-indigo-500"
    },
    PATIENT: {
      title: "Espace Patient",
      icon: Users,
      color: "text-teal-500",
      bg: "bg-teal-500",
      shadow: "shadow-teal-500/20",
      border: "focus:border-teal-500"
    }
  };

  const current = configs[role] || configs.MEDECIN;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      if (result.role !== role) {
        useAuthStore.getState().logout();
        toast.error(`Accès refusé. Ce compte appartient à un ${result.role}, mais vous essayez de vous connecter à l'espace ${role}.`);
        return;
      }

      if (result.role === 'PATIENT') {
        navigate('/patient-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#020617]">
      {/* BACKGROUND GLOW DYNAMIQUE */}
      <div className={`fixed top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full -z-10 opacity-20 ${current.bg}`}></div>

      {/* BOUTON RETOUR */}
      <button 
        onClick={() => navigate('/patient')}
        className="absolute top-10 left-10 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest transition"
      >
        <ArrowLeft size={16} /> Retour à l'espace patient
      </button>

      <div className="max-w-md w-full glass p-10 rounded-[40px] border-white/5 relative shadow-2xl">
        {/* HEADER DYNAMIQUE */}
        <div className="flex flex-col items-center mb-10">
          <div className={`${current.bg} p-4 rounded-2xl text-white mb-6 shadow-2xl ${current.shadow} animate-float`}>
            <current.icon size={32} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{current.title}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck size={14} /> Connexion Sécurisée
          </p>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identifiant</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-white outline-none transition-all ${current.border} focus:bg-white/10`}
                placeholder="Nom d'utilisateur"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-white outline-none transition-all ${current.border} focus:bg-white/10`}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className={`w-full ${current.bg} text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2`}
          >
            Entrer dans la session <ChevronRight size={16} />
          </button>
        </form>

        {/* LIEN D'INSCRIPTION POUR LES NOUVEAUX PATIENTS */}
        {role === 'PATIENT' && (
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs font-medium">
              Nouveau patient ?{' '}
              <span 
                onClick={() => navigate('/patient/signup')} 
                className="text-teal-400 cursor-pointer font-bold hover:underline ml-1"
              >
                Créer un compte santé
              </span>
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            Besoin d'aide ? <span className={`${current.color} cursor-pointer hover:underline`}>Contactez le support</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;