import React, { useEffect, useState } from 'react';
import MedicalCalendar from '../components/MedicalCalendar';
import useAppointmentStore from '../store/appointmentStore';
import { Activity, Video, User, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  // AJUSTEMENT 1 : On récupère 'appointments' (pour le calendrier) ET 'todayAppointments' (pour les KPIs)
  const { appointments, todayAppointments, fetchAppointments } = useAppointmentStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAppointments(); // Charge tous les RDV confirmés
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchAppointments]);

  // --- KPIs calculés depuis les données de AUJOURD'HUI ---
  const totalConfirmes  = todayAppointments.length;
  const enVisio         = todayAppointments.filter(a => a.type === 'VISIO').length;
  const enPresentiel    = todayAppointments.filter(a => a.type === 'PRESENTIEL').length;

  // Prochain RDV : le plus proche de maintenant
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const prochainRdv = todayAppointments
    .filter(a => {
      const [h, m] = (a.heure || '00:00').split(':').map(Number);
      return h * 60 + m >= nowMinutes;
    })
    .sort((a, b) => a.heure.localeCompare(b.heure))[0];

  const kpis = [
    {
      icon: CheckCircle,
      value: totalConfirmes,
      label: 'Confirmés aujourd\'hui',
      color: 'blue',
      sub: totalConfirmes === 0 ? 'Agenda libre' : `${totalConfirmes} patient${totalConfirmes > 1 ? 's' : ''}`
    },
    {
      icon: User,
      value: enPresentiel,
      label: 'Présentiel',
      color: 'emerald',
      sub: enPresentiel === 0 ? 'Aucun' : `sur ${totalConfirmes} RDV`
    },
    {
      icon: Video,
      value: enVisio,
      label: 'Visio',
      color: 'indigo',
      sub: enVisio === 0 ? 'Aucun' : `sur ${totalConfirmes} RDV`
    },
    {
      icon: Clock,
      value: prochainRdv
        ? prochainRdv.heure.slice(0, 5)
        : '--:--',
      label: 'Prochain RDV',
      color: 'amber',
      sub: prochainRdv
        ? (prochainRdv.patient_nom_complet || 'Patient')
        : 'Aucun à venir'
    },
  ];

  const colorMap = {
    blue:   { bg: 'bg-blue-600/15',   text: 'text-blue-400',   hover: 'hover:border-blue-500/40',  icon: 'group-hover:bg-blue-600'   },
    emerald:{ bg: 'bg-emerald-600/15',text: 'text-emerald-400',hover: 'hover:border-emerald-500/40',icon: 'group-hover:bg-emerald-600'},
    indigo: { bg: 'bg-indigo-600/15', text: 'text-indigo-400', hover: 'hover:border-indigo-500/40', icon: 'group-hover:bg-indigo-600' },
    amber:  { bg: 'bg-amber-600/15',  text: 'text-amber-400',  hover: 'hover:border-amber-500/40',  icon: 'group-hover:bg-amber-600'  },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
            Mon Agenda
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {totalConfirmes === 0
              ? 'Aucun rendez-vous confirmé pour aujourd\'hui.'
              : `${totalConfirmes} rendez-vous confirmé${totalConfirmes > 1 ? 's' : ''} — cliquez sur un créneau pour démarrer la consultation.`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-black text-white tabular-nums tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
            {currentTime.toLocaleTimeString([], { second: '2-digit' })}s
          </p>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, value, label, color, sub }) => {
          const c = colorMap[color];
          return (
            <div
              key={label}
              className={`glass p-5 rounded-3xl border border-white/5 ${c.hover} transition-all group cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} ${c.icon} group-hover:text-white transition-all`}>
                  <Icon size={20} />
                </div>
                <TrendingUp size={12} className="text-white/10 mt-1" />
              </div>
              <p className="text-white font-black text-3xl tracking-tighter leading-none">
                {value}
              </p>
              <p className={`text-[10px] font-black ${c.text} uppercase tracking-widest mt-1`}>
                {label}
              </p>
              <p className="text-slate-600 text-[10px] mt-1 truncate">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── CALENDRIER (AJUSTEMENT CRUCIAL : on passe 'appointments' et non plus 'todayAppointments') ── */}
      <div className="animate-in slide-in-from-bottom duration-700">
        <MedicalCalendar appointments={appointments} />
      </div>
    </div>
  );
};

export default Dashboard;