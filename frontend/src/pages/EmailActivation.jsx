import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, AlertCircle, Loader2, User, 
  Phone, CreditCard, Calendar, ArrowRight, ShieldCheck 
} from 'lucide-react';
import axios from 'axios';

const EmailActivation = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  // États de la page
  const [verifying, setVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    cin: '',
    telephone: '',
    dateNaissance: '',
    genre: 'M'
  });

  // 1. Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/users/activate/${uidb64}/${token}/`);
        if (res.data.valid) {
          setIsValid(true);
        }
      } catch (err) {
        setError("Le lien d'activation est invalide ou a expiré.");
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [uidb64, token]);

  // 2. Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:8000/api/users/activate/${uidb64}/${token}/`, formData);
      
      // Succès : Redirection vers le login ou dashboard
      // Note : Puisque le compte est activé, on demande au patient de se connecter
      alert("Compte activé et profil créé avec succès !");
      navigate('/login?role=PATIENT');
    } catch (err) {
      setError("Une erreur est survenue lors de la création de votre profil.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- ÉCRAN DE CHARGEMENT ---
  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="text-teal-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Vérification de sécurité...</p>
        </div>
      </div>
    );
  }

  // --- ÉCRAN D'ERREUR ---
  if (error && !isValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-xl max-w-md w-full text-center border border-red-100">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Lien invalide</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold transition-all hover:bg-slate-900"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // --- ÉCRAN DE COMPLÉTION DU PROFIL ---
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-2xl w-full border border-white relative overflow-hidden">
        
        {/* Header de la page */}
        <div className="relative z-10 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Email vérifié !</h1>
              <p className="text-teal-600 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Dernière étape : Complétez votre profil</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Votre adresse email a été confirmée. Veuillez remplir les informations suivantes pour finaliser la création de votre **Dossier Médical Numérique**.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 relative z-10">
          {/* NOM */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Nom</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" required
                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                onChange={e => setFormData({...formData, nom: e.target.value})}
              />
            </div>
          </div>

          {/* PRÉNOM */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Prénom</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" required
                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                onChange={e => setFormData({...formData, prenom: e.target.value})}
              />
            </div>
          </div>

          {/* CIN */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">N° de CIN</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" required placeholder="Ex: AB123456"
                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                onChange={e => setFormData({...formData, cin: e.target.value})}
              />
            </div>
          </div>

          {/* TÉLÉPHONE */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="tel" required placeholder="06..."
                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                onChange={e => setFormData({...formData, telephone: e.target.value})}
              />
            </div>
          </div>

          {/* DATE NAISSANCE */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Date de naissance</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="date" required
                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                onChange={e => setFormData({...formData, dateNaissance: e.target.value})}
              />
            </div>
          </div>

          {/* GENRE */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Sexe</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold appearance-none cursor-pointer"
              onChange={e => setFormData({...formData, genre: e.target.value})}
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>

          {/* BOUTON FINAL */}
          <button 
            type="submit" 
            disabled={submitting}
            className="md:col-span-2 bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>Finaliser mon inscription <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Décoration en arrière-plan */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-50 rounded-full opacity-50 z-0"></div>
      </div>
    </div>
  );
};

export default EmailActivation;