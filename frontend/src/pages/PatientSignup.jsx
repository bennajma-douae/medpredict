import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, User, Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const PatientSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post('http://localhost:8000/api/users/', {
        ...formData,
        role: 'PATIENT'
      });

      setMessage({
        type: 'success',
        text: 'Compte créé avec succès ! Un email de vérification a été envoyé. Vérifiez votre boîte mail.'
      });

      // Redirection vers login après 3 secondes
      setTimeout(() => {
        navigate('/login?role=PATIENT');
      }, 3000);

        } catch (err) {
  console.error("Erreur d'inscription :", err.response?.data);

  let errorMsg = "Une erreur est survenue lors de l'inscription.";
  let showLoginButton = false;

  if (err.response?.data) {
    const data = err.response.data;

    if (data.email && data.email[0]?.includes("existe déjà")) {
      errorMsg = "Un compte existe déjà avec cet email.";
      showLoginButton = true;
    } 
    else if (data.username) {
      errorMsg = `Nom d'utilisateur : ${data.username[0]}`;
    } 
    else if (typeof data === 'string') {
      errorMsg = data;
    }
  }

  setMessage({ 
    type: 'error', 
    text: errorMsg,
    showLoginButton: showLoginButton 
  });
} finally {
  setLoading(false);
}
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass rounded-[40px] p-10 border border-white/10">
        <button 
          onClick={() => navigate('/patient')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm"
        >
          <ArrowLeft size={18} /> Retour à l'espace patient
        </button>

        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mb-4">
            <Mail size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">Créer mon compte patient</h2>
          <p className="text-slate-400 mt-2">Inscription sécurisée avec vérification email</p>
        </div>

       {message.text && (
  <div className={`p-4 rounded-2xl mb-6 flex flex-col gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
    <div className="flex items-start gap-3">
      <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
      <p>{message.text}</p>
    </div>

        {message.showLoginButton && (
            <button
                onClick={() => navigate('/login?role=PATIENT')}
                className="mt-2 text-teal-400 hover:text-teal-300 font-bold text-sm underline self-start"
            >
                Se connecter avec cet email →
            </button>
            )}
        </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Nom d'utilisateur</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-500" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 pl-12 py-4 rounded-2xl focus:border-teal-500 outline-none"
                placeholder="Ex: ahmed_patient"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-500" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 pl-12 py-4 rounded-2xl focus:border-teal-500 outline-none"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 pl-12 py-4 rounded-2xl focus:border-teal-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-70"
          >
            {loading ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-8">
          Un email de vérification vous sera envoyé après l'inscription.
        </p>
      </div>
    </div>
  );
};

export default PatientSignup;