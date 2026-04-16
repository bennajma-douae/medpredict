import React, { useState, useEffect } from 'react';
import { Video, User, PlayCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MedicalCalendar = ({ appointments }) => {
  const navigate = useNavigate();
  const [viewType, setViewType]     = useState('Aujourd\'hui');
  const [now, setNow]               = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semaine courante

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Plages horaires (9h → 18h) ──
  const hours = [
    '09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00'
  ];

  // ── Jours de la semaine avec offset ──
  const getWeekDates = () => {
    const base = new Date(now);
    const dayOfWeek = base.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    base.setDate(base.getDate() + diffToMonday + weekOffset * 7);
    return ['Lun','Mar','Mer','Jeu','Ven'].map((label, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        label,
        date: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        monthLabel: d.toLocaleDateString('fr-FR', { month: 'short' }),
      };
    });
  };

  const days = getWeekDates();
  const todayStr = new Date().toISOString().split('T')[0];

  // ── Position ligne temps réel ──
  const calculateLineTop = () => {
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < 9 || h >= 18) return -200;
    return (h - 9) * 80 + (m / 60) * 80 + 44; // 44 = hauteur header jours
  };

  // ── Associer les RDV aux créneaux ──
  const getAppointmentsForSlot = (dateStr, hourStr) => {
    return appointments.filter(
      a => a.date === dateStr && a.heure && a.heure.startsWith(hourStr.slice(0, 2))
    );
  };

  // ── Colonnes à afficher selon la vue ──
  const visibleDays = viewType === 'Aujourd\'hui'
    ? days.filter(d => d.date === todayStr).length > 0
      ? days.filter(d => d.date === todayStr)
      : [days[0]]
    : days;

  const gridCols = viewType === 'Aujourd\'hui' ? 'grid-cols-1' : 'grid-cols-5';

  return (
    <div className="glass rounded-[40px] border-white/5 overflow-hidden flex flex-col" style={{ height: '720px' }}>

      {/* ── HEADER ── */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">
            {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>

          {/* Toggle vue */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {["Aujourd'hui", 'Semaine'].map(type => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  viewType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Navigation semaine */}
          {viewType === 'Semaine' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Heure système */}
        <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl">
          <Clock size={12} className="text-blue-400" />
          <span className="text-blue-400 text-xs font-black tabular-nums">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── GRILLE ── */}
      <div className="flex-1 overflow-y-auto relative">

        {/* Ligne temps réel */}
        {viewType === 'Aujourd\'hui' && (
          <div
            className="absolute left-14 right-0 z-30 pointer-events-none"
            style={{ top: `${calculateLineTop()}px` }}
          >
            <div className="relative flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_12px_#3b82f6] flex-shrink-0" />
              <div className="flex-1 border-t-2 border-blue-500 border-dashed opacity-70" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-[56px_1fr] h-full">

          {/* Colonne heures */}
          <div className="border-r border-white/5">
            <div className="h-11 border-b border-white/5" /> {/* spacer header */}
            {hours.map(h => (
              <div
                key={h}
                className="h-20 flex items-start justify-center pt-2 border-b border-white/5"
              >
                <span className="text-[10px] font-bold text-slate-600">{h}</span>
              </div>
            ))}
          </div>

          {/* Colonnes jours */}
          <div className={`grid ${gridCols}`}>
            {visibleDays.map(day => {
              const isToday = day.date === todayStr;
              return (
                <div
                  key={day.date}
                  className={`border-r border-white/5 last:border-r-0 relative ${isToday ? 'bg-blue-500/[0.025]' : ''}`}
                >
                  {/* Header du jour */}
                  <div className={`h-11 border-b border-white/5 flex flex-col items-center justify-center sticky top-0 z-10 ${
                    isToday ? 'bg-blue-600/10' : 'bg-slate-950/80'
                  }`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>
                      {day.label} {day.monthLabel}
                    </span>
                    <span className={`text-base font-black leading-none ${isToday ? 'text-white' : 'text-slate-400'}`}>
                      {day.dayNum}
                    </span>
                  </div>

                  {/* Créneaux horaires */}
                  {hours.map(h => {
                    const isPause = h === '12:00';
                    const slotRdvs = getAppointmentsForSlot(day.date, h);

                    return (
                      <div
                        key={h}
                        className={`h-20 border-b border-white/5 relative ${
                          isPause ? 'bg-white/[0.015]' : ''
                        }`}
                      >
                        {isPause && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/10 uppercase tracking-widest pointer-events-none">
                            Pause déjeuner
                          </span>
                        )}

                        {slotRdvs.map(rdv => {
                          const isVisio = rdv.type === 'VISIO';
                          return (
                            <button
                              key={rdv.id}
                              onClick={() => navigate(`/consultation/${rdv.id}`)}
                              className={`
                                absolute inset-1 rounded-2xl p-3 text-left
                                border-l-4 cursor-pointer z-20
                                transition-all duration-200
                                hover:scale-[1.02] hover:shadow-2xl
                                group flex flex-col justify-between
                                ${isVisio
                                  ? 'bg-indigo-600/80 border-l-indigo-300 hover:bg-indigo-500'
                                  : 'bg-blue-600/80 border-l-blue-200 hover:bg-blue-500'
                                }
                              `}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isVisio
                                    ? <Video size={10} className="text-white/80 flex-shrink-0" />
                                    : <User size={10} className="text-white/80 flex-shrink-0" />
                                  }
                                  <p className="text-[10px] font-black text-white uppercase truncate leading-tight">
                                    {rdv.patient_nom_complet || rdv.patient_nom || 'Patient'}
                                  </p>
                                </div>
                                <PlayCircle
                                  size={14}
                                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                                />
                              </div>
                              <div>
                                <p className="text-[9px] text-white/60 font-medium truncate">{rdv.motif}</p>
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 inline-block ${
                                  isVisio ? 'bg-indigo-400/20 text-indigo-200' : 'bg-blue-400/20 text-blue-200'
                                }`}>
                                  {isVisio ? 'Visio' : 'Présentiel'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── LÉGENDE ── */}
      <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-sm border-l-2 border-l-blue-300" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Présentiel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-600 rounded-sm border-l-2 border-l-indigo-300" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visio</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500 border-dashed border-t-2" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Heure actuelle</span>
        </div>
      </div>
    </div>
  );
};

export default MedicalCalendar;
