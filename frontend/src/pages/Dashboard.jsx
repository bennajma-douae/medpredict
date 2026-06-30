import React, { useEffect, useState } from 'react';
import MedicalCalendar from '../components/MedicalCalendar';
import useAppointmentStore from '../store/appointmentStore';
import { Activity, Video, User, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  // LOGIQUE ORIGINALE : Récupération des stores
  const { appointments, todayAppointments, fetchAppointments } = useAppointmentStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // États pour le mode Liste
  const [viewMode, setViewMode] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAppointments(); // Charge tous les RDV confirmés
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchAppointments]);

  // --- LOGIQUE CORRIGÉE : Calcul des KPIs (Seulement les RDV restants) ---
  const rdvRestants = todayAppointments.filter(a => a.statut !== 'TERMINE');

  const totalRestants = rdvRestants.length;
  const enVisio = rdvRestants.filter(a => a.type === 'VISIO').length;
  const enPresentiel = rdvRestants.filter(a => a.type === 'PRESENTIEL').length;

  // LOGIQUE CORRIGÉE : Déterminer le jour de travail effectif affiché (lundi si week-end)
  const getWorkDate = (d) => {
    const resDate = new Date(d);
    const day = resDate.getDay();
    if (day === 0) { // Dimanche
      resDate.setDate(resDate.getDate() + 1);
    } else if (day === 6) { // Samedi
      resDate.setDate(resDate.getDate() + 2);
    }
    return resDate;
  };

  const workDate = getWorkDate(currentTime);
  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;

  // LOGIQUE CORRIGÉE : Prochain RDV (parmi les RDV restants)
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const prochainRdv = rdvRestants
    .filter(a => {
      if (isWeekend) return true; // Le week-end, tout est à venir pour le prochain jour ouvré !
      const [h, m] = (a.heure || '00:00').split(':').map(Number);
      return h * 60 + m >= nowMinutes;
    })
    .sort((a, b) => a.heure.localeCompare(b.heure))[0];

  const kpis = [
    {
      icon: CheckCircle,
      value: totalRestants,
      label: 'RDV à faire',
      color: 'blue',
      sub: totalRestants === 0 ? 'Agenda libre' : `${totalRestants} patient${totalRestants > 1 ? 's' : ''}`
    },
    {
      icon: User,
      value: enPresentiel,
      label: 'Présentiel',
      color: 'emerald',
      sub: enPresentiel === 0 ? 'Aucun' : `sur ${totalRestants} RDV`
    },
    {
      icon: Video,
      value: enVisio,
      label: 'Visio',
      color: 'indigo',
      sub: enVisio === 0 ? 'Aucun' : `sur ${totalRestants} RDV`
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

  // Calcul de l'âge du patient
  const calcAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const today = new Date();
    const born = new Date(dateNaissance);
    let age = today.getFullYear() - born.getFullYear();
    const m = today.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
    return age;
  };

  // Filtrer les rendez-vous pour le mode Liste
  const filteredAppointmentsForList = appointments
    .filter(a => {
      const nomPatient = a.patient_nom_complet || a.patient_nom || '';
      const matchSearch = nomPatient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.motif || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter ? a.statut === statusFilter : true;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.heure.localeCompare(b.heure));

  // STYLE : Palette Medical Light adaptée au fond blanc
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'bg-emerald-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: 'bg-indigo-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: 'bg-amber-600' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ── HEADER (Style Light) ── */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1.5">
            {workDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {isWeekend && " • Prochain Jour Ouvré"}
          </p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">
            Mon Agenda
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 font-medium">
            {totalRestants === 0
              ? 'Aucun rendez-vous en attente.'
              : `${totalRestants} rendez-vous restant${totalRestants > 1 ? 's' : ''} ${isWeekend ? 'pour lundi' : 'aujourd\'hui'} — cliquez sur un créneau pour démarrer la consultation.`}
          </p>
        </div>

        <div className="text-right">
          <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xl font-black text-slate-800 tabular-nums tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-blue-600 text-[9px] font-black uppercase tracking-widest text-center mt-0.5">Temps Réel</p>
          </div>
        </div>
      </div>

      {/* ── KPIs (Style Light) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, value, label, color, sub }) => {
          const c = colorMap[color];
          return (
            <div
              key={label}
              className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-default`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <TrendingUp size={14} className="text-slate-200" />
              </div>
              <p className="text-slate-800 font-black text-2xl tracking-tighter leading-none mb-1">
                {value}
              </p>
              <p className={`text-[9px] font-black ${c.text} uppercase tracking-widest`}>
                {label}
              </p>
              <p className="text-slate-400 text-[10px] mt-1.5 font-medium truncate">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── ACCÈS AGENDA ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* En-tête de la carte avec toggle */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-blue-600 animate-pulse" />
            Planning & consultations
          </h3>
          
          <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Calendrier
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Liste des RDV
            </button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <MedicalCalendar appointments={appointments} />
        ) : (
          <div className="p-6 space-y-6">
            {/* Barre d'outils de filtrage */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 focus-within:bg-white focus-within:border-blue-400 transition-all">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par patient, motif..."
                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 outline-none"
              >
                <option value="">Tous statuts</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>

            {/* Tableau / Grid des consultations */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full border-collapse text-left bg-white">
                <thead>
                  <tr className="bg-slate-50/80 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="p-4">Patient</th>
                    <th className="p-4">Date & Heure</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointmentsForList.map(a => {
                    const isCompleted = a.statut === 'TERMINE';
                    const isVisio = a.type === 'VISIO';
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium text-slate-700">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                              {(a.patient_nom_complet || a.patient_nom || 'P')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800">{a.patient_nom_complet || a.patient_nom}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {a.patient_genre === 'M' ? 'Homme' : a.patient_genre === 'F' ? 'Femme' : ''} 
                                {a.patient_date_naissance && ` • ${calcAge(a.patient_date_naissance)} ans`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 tabular-nums">
                          <p className="font-bold">{new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={10} /> {a.heure.slice(0, 5)}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-600">{a.motif}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border ${
                            isVisio
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {isVisio ? '📹 Visio' : '🏥 Cabinet'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border ${
                            isCompleted
                              ? 'bg-slate-50 text-slate-400 border-slate-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {a.statut}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => window.location.href = `/consultation/${a.id}`}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                              isCompleted
                                ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700 active:scale-95 shadow-blue-100'
                            }`}
                          >
                            {isCompleted ? 'Voir Dossier' : 'Démarrer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAppointmentsForList.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 italic">
                        Aucun rendez-vous trouvé correspondant aux critères.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;