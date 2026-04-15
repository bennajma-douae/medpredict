import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stethoscope, Clipboard, BrainCircuit, Save, ArrowLeft, Info } from 'lucide-react';
import axios from 'axios';

const Consultation = () => {
  const { rdvId } = useParams();
  const navigate = useNavigate();
  const [rdv, setRdv] = useState(null);
  const [symptomes, setSymptomes] = useState('');
  const [diagnostic, setDiagnostic] = useState('');

  useEffect(() => {
    const fetchRdvData = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/appointments/${rdvId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRdv(res.data);
    };
    fetchRdvData();
  }, [rdvId]);

  if (!rdv) return <div className="p-20 text-white">Chargement du dossier...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
      {/* HEADER DE SESSION */}
      <div className="flex justify-between items-center bg-blue-600 p-6 rounded-[32px] shadow-2xl shadow-blue-900/20">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition"><ArrowLeft/></button>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Consultation en cours</h2>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Mode : {rdv.type}</p>
          </div>
        </div>
        <div className="text-right text-white">
           <p className="text-xs font-black uppercase opacity-60">Heure début</p>
           <p className="text-xl font-black">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE : DOSSIER PATIENT */}
        <div className="glass p-8 rounded-[40px] border-white/5 space-y-8 h-fit">
           <div>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Info size={14}/> Patient</h3>
              <p className="text-2xl font-black text-white">{rdv.patient_nom}</p>
              <p className="text-xs text-blue-400 font-bold mt-1 uppercase">CIN : {rdv.patient_cin || "Non renseigné"}</p>
           </div>
           
           <div className="space-y-4 pt-6 border-t border-white/5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Âge</span><span className="text-white font-bold">32 ans</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Groupe Sanguin</span><span className="text-red-500 font-black">O+</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Dernière visite</span><span className="text-white">12/03/2025</span></div>
           </div>
        </div>

        {/* COLONNE DROITE : EXAMEN & SYMPTÔMES */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass p-10 rounded-[40px] border-white/5">
              <h3 className="text-white font-black uppercase text-sm mb-8 flex items-center gap-3">
                 <Clipboard className="text-blue-500" /> Observation Clinique
              </h3>
              
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Symptômes observés</label>
                    <textarea 
                      value={symptomes}
                      onChange={(e) => setSymptomes(e.target.value)}
                      placeholder="Saisissez les symptômes ici (ex: Fièvre, toux sèche...)"
                      className="w-full bg-white/5 border border-white/10 p-6 rounded-[24px] text-white outline-none focus:border-blue-500 min-h-[150px] transition-all"
                    />
                 </div>

                 {/* PLACEHOLDER IA */}
                 <div className="p-8 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-blue-500/30 rounded-[32px] relative overflow-hidden group">
                    <BrainCircuit className="absolute -right-4 -bottom-4 text-blue-500/10" size={150} />
                    <div className="relative z-10">
                       <h4 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                          <BrainCircuit size={16}/> Assistance Diagnostic IA
                       </h4>
                       <p className="text-slate-400 text-sm mb-6">L'analyse est prête. Veuillez cliquer pour obtenir des suggestions basées sur les symptômes saisis.</p>
                       <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                          Lancer l'analyse prédictive
                       </button>
                    </div>
                 </div>

                 <button className="w-full bg-white text-black py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all">
                    <Save size={18}/> Enregistrer la consultation
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Consultation;