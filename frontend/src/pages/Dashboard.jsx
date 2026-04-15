import React, { useEffect, useState } from 'react';
import MedicalCalendar from '../components/MedicalCalendar';
import useAppointmentStore from '../store/appointmentStore';
import { Plus, Activity, Users, Clock } from 'lucide-react';

const Dashboard = () => {
  // 1. On récupère les données réelles du Store
  const { todayAppointments, fetchTodayAgenda } = useAppointmentStore();
  
  // 2. État pour l'horloge en temps réel
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Charger les RDV au démarrage
    fetchTodayAgenda();

    // Lancer le timer pour l'horloge (mise à jour chaque seconde)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Nettoyer le timer quand on quitte la page
    return () => clearInterval(timer);
  }, [fetchTodayAgenda]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER SECTION AVEC HORLOGE DYNAMIQUE */}
      <div className="flex justify-between items-center border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
            Bonjour, Dr. Ahmed Alami
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-lg text-blue-400 font-bold uppercase text-[10px] tracking-widest">
              <Clock size={12} />
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-black text-xs shadow-lg shadow-blue-900/40">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
           <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5">
              Historique
           </button>
           <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40">
              <Plus size={16} className="inline mr-2" /> Nouveau RDV
           </button>
        </div>
      </div>

      {/* STATS RAPIDES (KPIs RÉELS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border-white/5 flex items-center gap-6 group hover:border-blue-500/30 transition-all">
           <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xl">
              <Activity size={28}/>
           </div>
           <div>
              <p className="text-white font-black text-3xl tracking-tighter">{todayAppointments.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consultations Jour</p>
           </div>
        </div>

        <div className="glass p-6 rounded-3xl border-white/5 flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
           <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xl">
              <Users size={28}/>
           </div>
           <div>
              <p className="text-white font-black text-3xl tracking-tighter">04</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nouveaux Dossiers</p>
           </div>
        </div>

        <div className="glass p-6 rounded-3xl border-white/5 flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
           <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xl">
              <Clock size={28}/>
           </div>
           <div>
              <p className="text-white font-black text-3xl tracking-tighter">100%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disponibilité</p>
           </div>
        </div>
      </div>

      {/* LE CALENDRIER STYLE OUTLOOK (DYNAMIQUE) */}
      <div className="animate-in slide-in-from-bottom duration-1000">
        <MedicalCalendar appointments={todayAppointments} />
      </div>

    </div>
  );
};

export default Dashboard;