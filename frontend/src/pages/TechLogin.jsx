import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, ShieldAlert, Cpu, ChevronRight } from 'lucide-react';
import useAuthStore from '../store/authStore';

const TechLogin = () => {
  // 1. Déclarer les états pour capturer les saisies
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // 2. Fonction de connexion
  const handleTechLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      // On vérifie que c'est bien un ADMIN qui se connecte ici
      if (result.role === 'ADMIN') {
        navigate('/tech-dashboard');
      } else {
        setError("ACCÈS REFUSÉ : Privilèges insuffisants.");
        useAuthStore.getState().logout(); // Déconnexion automatique si pas admin
      }
    } else {
      setError("ERREUR SYSTÈME : Identifiants invalides.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono p-6">
      <div className="max-w-md w-full border border-green-500/30 p-10 rounded-lg bg-slate-900/50 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
        
        <form onSubmit={handleTechLogin}>
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-green-500/10 rounded-full text-green-500 mb-4 border border-green-500/20">
              <Terminal size={40} />
            </div>
            <h1 className="text-xl font-bold text-green-500 tracking-[0.3em] uppercase">Tech Console</h1>
            <p className="text-slate-500 text-[10px] mt-2 italic text-center">Restricted Access - Authorized Personnel Only</p>
          </div>

          {/* Affichage des erreurs en mode terminal */}
          {error && (
            <div className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 text-[10px] uppercase font-bold animate-pulse">
              {">"} {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-green-500/70 uppercase tracking-widest">Technician ID</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-green-500/30 p-4 rounded text-green-500 outline-none focus:border-green-500 transition-all text-sm" 
                placeholder="ID-XXXXX" 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-green-500/70 uppercase tracking-widest">Access Token</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-green-500/30 p-4 rounded text-green-500 outline-none focus:border-green-500 transition-all text-sm" 
                placeholder="••••••••" 
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-4 rounded transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
            >
              Initialize System Session <ChevronRight size={16}/>
            </button>
          </div>
        </form>

        <div className="mt-8 flex justify-center gap-4 text-slate-700">
            <ShieldAlert size={16} />
            <Cpu size={16} />
        </div>
      </div>
    </div>
  );
};

export default TechLogin;