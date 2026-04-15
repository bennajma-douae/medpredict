import React, { useState, useEffect } from 'react';
import { 
  Terminal, Settings, Server, Database, Cpu, CheckCircle2, 
  UserPlus, X, ChevronRight, Stethoscope, Users as UsersIcon, RefreshCw
} from 'lucide-react';
import axios from 'axios';

const TechDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [staff, setStaff] = useState({ doctor: null, secretary: null });
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'MEDECIN' });

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const doctor = res.data.find(u => u.role === 'MEDECIN');
      const secretary = res.data.find(u => u.role === 'SECRETAIRE');
      setStaff({ doctor, secretary });
    } catch (err) { console.error("Erreur chargement staff", err); }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleProvision = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/users/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      fetchStaff(); // On rafraîchit la vue
      alert(`Le compte ${formData.role} a été créé avec succès !`);
    } catch (err) { 
        alert("Erreur : Vérifiez que le nom d'utilisateur n'existe pas déjà."); 
    }
    <button 
      onClick={() => { logout(); navigate('/tech-ops'); }}
      className="glass px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
    >
      <LogOut size={18} />
    </button>
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
              <Settings className="text-green-500" /> Instance de Maintenance
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Surveillance du Cabinet Unique</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2"
          >
            <UserPlus size={14} /> Créer un compte
          </button>
        </header>

        {/* MODAL DE CRÉATION */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="glass p-10 rounded-[40px] border-white/10 max-w-md w-full relative">
              <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X/></button>
              <h2 className="text-2xl font-black text-white uppercase mb-8">Nouveau Praticien</h2>
              <form onSubmit={handleProvision} className="space-y-4">
                <input type="text" placeholder="Nom d'utilisateur" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, username: e.target.value})} />
                <input type="email" placeholder="Email professionnel" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, email: e.target.value})} />
                <input type="password" placeholder="Mot de passe temporaire" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, password: e.target.value})} />
                <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="MEDECIN">Médecin</option>
                  <option value="SECRETAIRE">Secrétaire</option>
                </select>
                <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white mt-4 hover:bg-blue-500 transition-all">Valider l'accès</button>
              </form>
            </div>
          </div>
        )}

        {/* LISTE DU STAFF */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="glass p-8 rounded-[40px] border-blue-500/20 relative overflow-hidden">
             <Stethoscope className="absolute -right-4 -top-4 text-blue-500/5 rotate-12" size={120} />
             <h3 className="text-white font-black uppercase mb-6 flex items-center gap-2">Médecin</h3>
             {staff.doctor ? (
               <div className="space-y-1">
                 <p className="text-xl font-bold text-white uppercase">{staff.doctor.username}</p>
                 <p className="text-xs text-slate-500">{staff.doctor.email}</p>
               </div>
             ) : (
               <p className="text-xs text-orange-500 font-bold uppercase animate-pulse">En attente de configuration...</p>
             )}
          </div>

          <div className="glass p-8 rounded-[40px] border-indigo-500/20 relative overflow-hidden">
             <UsersIcon className="absolute -right-4 -top-4 text-indigo-500/5 rotate-12" size={120} />
             <h3 className="text-white font-black uppercase mb-6 flex items-center gap-2">Secrétaire</h3>
             {staff.secretary ? (
               <div className="space-y-1">
                 <p className="text-xl font-bold text-white uppercase">{staff.secretary.username}</p>
                 <p className="text-xs text-slate-500">{staff.secretary.email}</p>
               </div>
             ) : (
               <p className="text-xs text-orange-500 font-bold uppercase animate-pulse">En attente de configuration...</p>
             )}
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="glass p-6 rounded-[30px] border-white/5 bg-black/40 flex justify-between items-center px-10">
           <div className="flex items-center gap-3"><Server className="text-blue-500" size={16}/><span className="text-[10px] font-bold uppercase">Backend API OK</span></div>
           <div className="flex items-center gap-3"><Database className="text-indigo-500" size={16}/><span className="text-[10px] font-bold uppercase">Postgres 18 OK</span></div>
           <div className="flex items-center gap-3"><Cpu className="text-purple-500" size={16}/><span className="text-[10px] font-bold uppercase">AI Service Ready</span></div>
        </div>

      </div>
    </div>
  );
};

export default TechDashboard;