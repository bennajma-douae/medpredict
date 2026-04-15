import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  UserCog, 
  Users, 
  ChevronRight, 
  ArrowLeft 
} from 'lucide-react';

const RoleCard = ({ icon: Icon, title, desc, color, onClick }) => (
  <div 
    onClick={onClick}
    className="glass p-8 rounded-[32px] cursor-pointer group hover:border-white/20 transition-all duration-500 flex flex-col items-center text-center animate-float"
  >
    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-2xl ${color} group-hover:scale-110`}>
      <Icon size={40} className="text-white" />
    </div>
    <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed mb-8">{desc}</p>
    <div className="mt-auto flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Accéder au portail <ChevronRight size={16} />
    </div>
  </div>
);

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full -z-10"></div>

      {/* BOUTON RETOUR */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-10 left-10 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition"
      >
        <ArrowLeft size={18} /> Retour à l'accueil
      </button>

      {/* HEADER */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
            <Stethoscope size={24} />
          </div>
          <span className="text-2xl font-black text-white italic tracking-tighter uppercase">MedPredict</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Choisissez votre portail</h1>
        <p className="text-slate-500 mt-2 font-medium">Sélectionnez votre session pour continuer</p>
      </div>

      {/* CARDS GRID */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        <RoleCard 
          icon={Stethoscope}
          title="Médecin"
          desc="Espace dédié aux praticiens. Diagnostics IA, gestion des consultations et ordonnances."
          color="bg-blue-600 shadow-blue-600/40"
          onClick={() => navigate('/login?role=MEDECIN')}
        />
        <RoleCard 
          icon={UserCog}
          title="Secrétaire"
          desc="Gestion de l'accueil, planification des rendez-vous et dossiers administratifs des patients."
          color="bg-indigo-600 shadow-indigo-600/40"
          onClick={() => navigate('/login?role=SECRETAIRE')}
        />
        <RoleCard 
          icon={Users}
          title="Patient"
          desc="Accès à votre espace santé, historique des rendez-vous et résultats de consultations."
          color="bg-teal-500 shadow-teal-500/40"
          onClick={() => navigate('/login?role=PATIENT')}
        />
      </div>

      <p className="mt-16 text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em]">
        Système de Gestion Médicale Sécurisé v4.0
      </p>
    </div>
  );
};

export default RoleSelection;