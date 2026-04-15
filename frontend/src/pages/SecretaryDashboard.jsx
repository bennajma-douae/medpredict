import React, { useEffect } from 'react';
import { 
  UserCheck, Calendar, Clock, Inbox, 
  CheckCircle2, XCircle, Search, Users, ChevronRight
} from 'lucide-react';
import useSecretaryStore from '../store/secretaryStore';

const SecretaryDashboard = () => {
  const { requests, fetchRequests, acceptRequest, loading } = useSecretaryStore();

  useEffect(() => { fetchRequests(); }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Portail Secrétariat</h1>
          <p className="text-slate-500 text-sm font-medium">Gestion des admissions et planification du cabinet.</p>
        </div>
        <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-2 rounded-2xl">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Demandes en attente</p>
          <p className="text-xl font-black text-white text-center">{requests.length}</p>
        </div>
      </div>

      {/* SECTION DES DEMANDES ENTRANTES */}
      <div className="glass rounded-[40px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
          <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Inbox className="text-indigo-500" /> Nouvelles Demandes de RDV
          </h3>
        </div>

        {requests.length > 0 ? (
          <div className="p-6 grid gap-4">
            {requests.map((req) => (
              <div key={req.id} className="glass p-6 rounded-3xl border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 font-black">
                     RQ
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold uppercase tracking-tight">Utilisateur #{req.user}</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-400 uppercase font-black">ID: {req.id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar size={14}/> {req.date}</span>
                      <span className="flex items-center gap-1"><Clock size={14}/> {req.heure}</span>
                    </div>
                    <p className="text-xs text-indigo-400 mt-2 italic">Motif : {req.motif}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <XCircle size={20} />
                   </button>
                   <button 
                    onClick={() => acceptRequest(req)}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-green-500 transition-all shadow-lg shadow-green-900/20"
                   >
                      <UserCheck size={18} /> Valider & Créer Dossier
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <p className="text-slate-500 font-medium italic text-sm">Toutes les demandes ont été traitées.</p>
          </div>
        )}
      </div>

      {/* QUICK VIEW CALENDRIER (Fictif pour le moment) */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[40px] border-white/5">
           <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-3"><Calendar size={18} className="text-indigo-400"/> Agenda d'aujourd'hui</h3>
           <div className="text-center py-10">
              <p className="text-slate-600 text-xs italic">Chargement du calendrier...</p>
           </div>
        </div>
        <div className="glass p-8 rounded-[40px] border-white/5">
           <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-3"><Users size={18} className="text-indigo-400"/> Dossiers Patients</h3>
           <button className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">
              Consulter la base patients complète
           </button>
        </div>
      </div>
    </div>
  );
};

export default SecretaryDashboard;