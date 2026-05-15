import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';

const PatientLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 relative">
      {/* Flèche retour en haut à gauche */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-10"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">Retour à l'accueil</span>
      </button>

      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-teal-600 p-4 rounded-2xl">
              <Users size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic mb-4">
            Espace Patient
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Gérez vos rendez-vous, consultez votre dossier médical et suivez vos consultations en toute sécurité.
          </p>
        </div>

        <div className="glass rounded-[40px] p-10 space-y-8 border border-white/10">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Bienvenue dans votre espace santé</h2>
            <p className="text-slate-400">Accédez à tous vos services médicaux en quelques clics</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Bouton Inscription */}
            <button
              onClick={() => navigate('/patient/signup')}
              className="bg-teal-600 hover:bg-teal-500 transition-all p-8 rounded-3xl flex flex-col items-center gap-4 group"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail size={32} />
              </div>
              <div className="text-center">
                <p className="font-black text-xl">Créer mon compte</p>
                <p className="text-teal-100 text-sm mt-1">Inscription rapide + vérification email</p>
              </div>
              <ArrowRight className="mt-4 opacity-70 group-hover:opacity-100 transition-all" />
            </button>

            {/* Bouton Connexion */}
            <button
              onClick={() => navigate('/login?role=PATIENT')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 transition-all p-8 rounded-3xl flex flex-col items-center gap-4 group"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <div className="text-center">
                <p className="font-black text-xl">J'ai déjà un compte</p>
                <p className="text-slate-400 text-sm mt-1">Se connecter à mon espace</p>
              </div>
              <ArrowRight className="mt-4 opacity-70 group-hover:opacity-100 transition-all" />
            </button>
          </div>

          <div className="text-center text-xs text-slate-500 pt-6 border-t border-white/5">
            Vos données sont protégées et conformes aux normes de confidentialité médicales.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLanding;