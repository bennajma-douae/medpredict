import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, ChevronRight, Mail, Lock, User } from 'lucide-react';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'PATIENT' });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // On utilise l'API users qui a déjà le serializer.create_user
      await axios.post('http://localhost:8000/api/users/', formData);
      alert("Compte créé ! Connectez-vous maintenant.");
      navigate('/login?role=PATIENT');
    } catch (err) { alert("Erreur lors de l'inscription."); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="max-w-md w-full glass p-10 rounded-[40px] border-white/5">
        <button onClick={() => navigate('/connexion')} className="text-slate-500 hover:text-white mb-8 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"><ArrowLeft size={16}/> Retour</button>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Créer mon espace santé</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="text" placeholder="Pseudo" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-teal-500" onChange={e => setFormData({...formData, username: e.target.value})} />
          <input type="email" placeholder="Email" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-teal-500" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Mot de passe" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-teal-500" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full bg-teal-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white mt-4 shadow-lg shadow-teal-500/20">Finaliser l'inscription</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;