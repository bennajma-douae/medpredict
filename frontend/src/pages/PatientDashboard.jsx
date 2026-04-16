import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Heart, ShieldCheck, FileText, 
  Plus, ChevronRight, Activity, Droplet, AlertTriangle, Send, X , LogOut
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const { user, token, logout } = useAuthStore();
  const [hasProfile, setHasProfile] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(null); // null = en cours de vérification
  const navigate = useNavigate();

  const [rdvData, setRdvData] = useState({ date: '', heure: '', motif: '', medecin: null });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer les infos utilisateur pour vérifier l'email
      const usersRes = await axios.get('http://localhost:8000/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const currentUser = usersRes.data.find(u => u.id === user.id);
      const isVerified = currentUser?.email_verified || false;
      setEmailVerified(isVerified);

      // Si l'email n'est PAS vérifié → on arrête tout
      if (!isVerified) {
        setLoading(false);
        return;
      }

      // Récupérer le médecin pour la prise de RDV
      const doctor = usersRes.data.find(u => u.role === 'MEDECIN');
      if (doctor) {
        setRdvData(prev => ({ ...prev, medecin: doctor.id }));
      }

      // Récupérer les patients
      const patientsRes = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profile = patientsRes.data.find(p => p.user === user.id);
      
      if (profile) {
        setHasProfile(true);
        setPatientInfo(profile);
        
        const rdvRes = await axios.get('http://localhost:8000/api/appointments/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(rdvRes.data.filter(a => a.user === user.id));
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchData();
    }
  }, [user, token]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!rdvData.medecin) {
      alert("Erreur : Aucun médecin n'est configuré dans le cabinet.");
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/appointments/', 
        { ...rdvData, user: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Demande envoyée avec succès !");
      setShowBooking(false);
      fetchData();
    } catch (err) {
      console.error(err.response?.data);
      alert("Erreur : Vérifiez que tous les champs sont corrects.");
    }
  };

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-500 font-bold uppercase tracking-widest animate-pulse text-xs">
        Initialisation de votre session...
      </div>
    );
  }

  // Écran de blocage si email non vérifié
  if (emailVerified === false) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="glass max-w-md w-full p-10 rounded-[40px] text-center border border-red-500/30">
          <div className="text-red-500 mb-6">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-black text-white mb-4">Vérification d'email requise</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Votre adresse email n'a pas encore été vérifiée.<br />
            Veuillez cliquer sur le lien de vérification que nous vous avons envoyé par email.
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-2xl font-bold text-sm transition-all"
            >
              Se déconnecter
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-2xl font-bold text-sm transition-all"
            >
              J'ai vérifié mon email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VUE 1 : NOUVEAU PATIENT (sans profil) ---
  if (!hasProfile) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-10 animate-in fade-in duration-700 px-6">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-red-500 transition-colors tracking-widest"
        >
          <LogOut size={14} /> Quitter la session
        </button>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tight italic">Bienvenue, {user?.username}</h1>
          <p className="text-slate-400 max-w-lg mx-auto">Votre espace est prêt. Activez votre dossier médical en sollicitant une consultation.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-[40px] border-teal-500/20 flex flex-col items-center text-center group hover:border-teal-500/50 transition-all">
             <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500 mb-6 shadow-xl group-hover:scale-110 transition-transform">
               <Calendar size={32}/>
             </div>
             <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Prendre RDV</h3>
             <p className="text-slate-500 text-sm mb-8">Envoyez une demande de consultation au cabinet.</p>
             <button onClick={() => setShowBooking(true)} className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-500 transition-all shadow-lg shadow-teal-900/20">Démarrer</button>
          </div>
          <div className="glass p-8 rounded-[40px] border-white/5 flex flex-col items-center text-center opacity-30">
             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 mb-6"><FileText size={32}/></div>
             <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Dossier Médical</h3>
             <p className="text-slate-500 text-sm italic">Inactif pour le moment.</p>
          </div>
        </div>

        {showBooking && <BookingModal onClose={() => setShowBooking(false)} onSubmit={handleBooking} setData={setRdvData} data={rdvData} />}
      </div>
    );
  }

  // --- VUE 2 : PATIENT EXISTANT ---
  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8 animate-in fade-in duration-700 px-6">
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors tracking-[0.2em] mb-4"
          >
            <LogOut size={14} /> Déconnexion
          </button>
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Mon Espace Santé</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Cabinet MedPredict • Dossier #00{patientInfo?.id}</p>
        </div>
        <button onClick={() => setShowBooking(true)} className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-500 transition-all shadow-lg shadow-teal-900/20">
          <Plus size={16} /> Nouveau RDV
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* CARTE DOSSIER */}
        <div className="glass p-8 rounded-[40px] border-white/5 col-span-1 h-fit">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                 {patientInfo?.nom?.[0]}{patientInfo?.prenom?.[0]}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{patientInfo?.nom} {patientInfo?.prenom}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{patientInfo?.genre === 'M' ? 'Masculin' : 'Féminin'}</p>
              </div>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                 <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><Droplet size={14} className="text-red-500"/> Groupe</span>
                 <span className="text-white font-black text-sm">{patientInfo?.groupeSanguin || "—"}</span>
              </div>
              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                 <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-2 mb-2"><AlertTriangle size={12}/> Allergies</span>
                 <p className="text-xs text-slate-300 font-medium">{patientInfo?.allergies || "Aucune allergie signalée."}</p>
              </div>
           </div>
        </div>

        {/* HISTORIQUE */}
        <div className="glass p-8 rounded-[40px] border-white/5 md:col-span-2">
           <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-6 flex items-center gap-3">
              <Activity size={18} className="text-teal-400" /> Historique consultations
           </h3>
           <div className="space-y-3">
              {appointments.length > 0 ? appointments.map(app => (
                <div key={app.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[24px] border border-white/5 hover:border-teal-500/30 transition-all group">
                   <div className="flex items-center gap-5">
                      <div className="text-teal-500 font-black text-xs w-16">{app.date}</div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{app.motif}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{app.heure}</p>
                      </div>
                   </div>
                   <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border ${
                     app.statut === 'CONFIRME' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-slate-400 border-white/10'
                   }`}>
                      {app.statut.replace('_', ' ')}
                   </span>
                </div>
              )) : (
                <div className="text-center py-16 opacity-30">
                    <Calendar size={48} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Aucun historique</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {showBooking && <BookingModal onClose={() => setShowBooking(false)} onSubmit={handleBooking} setData={setRdvData} data={rdvData} />}
    </div>
  );
};

// COMPOSANT MODAL (inchangé)
const BookingModal = ({ onClose, onSubmit, setData, data }) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
     <div className="glass p-10 rounded-[40px] border-white/10 max-w-md w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
        <h2 className="text-2xl font-black text-white uppercase mb-2 tracking-tighter italic">Prendre RDV</h2>
        <p className="text-slate-500 text-xs font-medium mb-8">Traitement sous 24h.</p>
        
        <form onSubmit={onSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Date</label>
                <input type="date" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-teal-500 transition-all text-sm" onChange={e => setData({...data, date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Heure</label>
                <input type="time" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-teal-500 transition-all text-sm" onChange={e => setData({...data, heure: e.target.value})} />
              </div>
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Motif</label>
              <textarea placeholder="..." required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-teal-500 min-h-[100px] text-sm" onChange={e => setData({...data, motif: e.target.value})} />
           </div>
           <button type="submit" className="w-full bg-teal-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white mt-4 shadow-xl shadow-teal-900/40 hover:bg-teal-500 transition-all flex items-center justify-center gap-2">
              Confirmer <Send size={14}/>
           </button>
        </form>
     </div>
  </div>
);

export default PatientDashboard;