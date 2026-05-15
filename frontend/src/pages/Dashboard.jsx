import React, { useEffect, useState } from 'react';
import MedicalCalendar from '../components/MedicalCalendar';
import useAppointmentStore from '../store/appointmentStore';
import { Activity, Video, User, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  // LOGIQUE ORIGINALE : Récupération des stores
  const { appointments, todayAppointments, fetchAppointments } = useAppointmentStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAppointments(); // Charge tous les RDV confirmés
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchAppointments]);

  // --- LOGIQUE ORIGINALE : Calcul des KPIs ---
  const totalConfirmes  = todayAppointments.length;
  const enVisio         = todayAppointments.filter(a => a.type === 'VISIO').length;
  const enPresentiel    = todayAppointments.filter(a => a.type === 'PRESENTIEL').length;

  // LOGIQUE ORIGINALE : Prochain RDV
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

  // STYLE : Palette Medical Light adaptée au fond blanc
  const colorMap = {
    blue:    { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100',  icon: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-100',icon: 'bg-emerald-600'},
    indigo:  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: 'bg-indigo-600' },
    amber:   { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100',  icon: 'bg-amber-600'  },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── HEADER (Style Light) ── */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-8">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">
            Mon Agenda
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {totalConfirmes === 0
              ? 'Aucun rendez-vous confirmé pour aujourd\'hui.'
              : `${totalConfirmes} rendez-vous confirmé${totalConfirmes > 1 ? 's' : ''} — cliquez sur un créneau pour démarrer la consultation.`}
          </p>
        </div>

        <div className="text-right">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-3xl font-black text-slate-800 tabular-nums tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest text-center mt-1">Temps Réel</p>
          </div>
        </div>
      </div>

      {/* ── KPIs (Style Light) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(({ icon: Icon, value, label, color, sub }) => {
          const c = colorMap[color];
          return (
            <div
              key={label}
              className={`bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <TrendingUp size={14} className="text-slate-200" />
              </div>
              <p className="text-slate-800 font-black text-3xl tracking-tighter leading-none mb-1">
                {value}
              </p>
              <p className={`text-[10px] font-black ${c.text} uppercase tracking-widest`}>
                {label}
              </p>
              <p className="text-slate-400 text-[10px] mt-2 font-medium truncate">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── CALENDRIER (Ta logique de props conservée) ── */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <MedicalCalendar appointments={appointments} />
      </div>
    </div>
  );
};

export default Dashboard;