import React, { useState, useEffect } from 'react';
import { Video, User, PlayCircle, Clock, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react'; // ✅ AJOUT : AlertTriangle, X
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../store/uiStore';

const MedicalCalendar = ({ appointments }) => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState("Aujourd'hui");
  const [now, setNow] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semaine courante

  // ✅ AJOUT : États pour la modale de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Plages horaires (9h → 18h) ──
  const hours = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // ── Jours de la semaine avec offset ──
  const getWeekDates = () => {
    const base = new Date(now);
    const dayOfWeek = base.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    base.setDate(base.getDate() + diffToMonday + weekOffset * 7);
    return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((label, i) => {
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
  const visibleDays = viewType === "Aujourd'hui"
    ? days.filter(d => d.date === todayStr).length > 0
      ? days.filter(d => d.date === todayStr)
      : [days[0]]
    : days;

  const gridCols = viewType === "Aujourd'hui" ? 'grid-cols-1' : 'grid-cols-5';

  // ✅ AJOUT : Fonction pour gérer le clic sur un RDV
  const handleRdvClick = (rdv) => {
    if (rdv.statut === 'TERMINE') {
      toast.info("Cette consultation est déjà terminée et enregistrée.");
      return;
    }
    setSelectedRdv(rdv);
    setShowConfirmModal(true);
  };

  // ✅ AJOUT : Confirmer et lancer la consultation
  const handleConfirmStart = async () => {
    setShowConfirmModal(false);
    // On navigue vers la page de consultation pour TOUS les types de rendez-vous (Présentiel ET Visio)
    // Ainsi le médecin pourra générer le lien depuis la page du dossier et sauvegarder la consultation à la fin.
    navigate(`/consultation/${selectedRdv.id}`);
  };

  // ✅ AJOUT : Annuler
  const handleCancelStart = () => {
    setShowConfirmModal(false);
    setSelectedRdv(null);
  };

  return (
    <>
      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden flex flex-col shadow-sm" style={{ height: '720px' }}>

        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">
              {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>

            {/* Toggle vue */}
            <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
              {["Aujourd'hui", 'Semaine'].map(type => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Heure système */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
            <Clock size={12} className="text-blue-600" />
            <span className="text-blue-700 text-xs font-black tabular-nums">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* ── GRILLE ── */}
        <div className="flex-1 overflow-y-auto relative bg-white">

          {/* Ligne temps réel */}
          {viewType === "Aujourd'hui" && (
            <div
              className="absolute left-14 right-0 z-30 pointer-events-none"
              style={{ top: `${calculateLineTop()}px` }}
            >
              <div className="relative flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg flex-shrink-0" />
                <div className="flex-1 border-t-2 border-blue-600 border-dashed opacity-20" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-[56px_1fr] h-full">

            {/* Colonne heures */}
            <div className="border-r border-slate-100 bg-slate-50/20">
              <div className="h-11 border-b border-slate-100" /> {/* spacer header */}
              {hours.map(h => (
                <div
                  key={h}
                  className="h-20 flex items-start justify-center pt-2 border-b border-slate-100"
                >
                  <span className="text-[10px] font-bold text-slate-400">{h}</span>
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
                    className={`border-r border-slate-100 last:border-r-0 relative ${isToday ? 'bg-blue-50/20' : ''}`}
                  >
                    {/* Header du jour */}
                    <div className={`h-11 border-b border-slate-100 flex flex-col items-center justify-center sticky top-0 z-10 ${isToday ? 'bg-blue-100/50' : 'bg-white/95 backdrop-blur-sm'
                      }`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        {day.label} {day.monthLabel}
                      </span>
                      <span className={`text-base font-black leading-none ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
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
                          className={`h-20 border-b border-slate-50 relative ${isPause ? 'bg-slate-50/50' : ''
                            }`}
                        >
                          {isPause && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
                              Pause déjeuner
                            </span>
                          )}

                          {slotRdvs.map(rdv => {
                            const isVisio = rdv.type === 'VISIO';
                            const isTermine = rdv.statut === 'TERMINE';

                            // Style de base selon le statut et le type
                            let bgClass = '';
                            if (isTermine) {
                              bgClass = 'bg-slate-200 border-l-slate-400 text-slate-500 opacity-60';
                            } else if (isVisio) {
                              bgClass = 'bg-indigo-600 border-l-indigo-300 text-white';
                            } else {
                              bgClass = 'bg-blue-600 border-l-blue-300 text-white';
                            }

                            return (
                              <button
                                key={rdv.id}
                                onClick={() => handleRdvClick(rdv)} // ✅ MODIFIÉ : appel à handleRdvClick au lieu de navigate direct
                                className={`
                                  absolute inset-1 rounded-2xl p-3 text-left
                                  border-l-4 cursor-pointer z-20
                                  transition-all duration-200
                                  ${isTermine ? 'cursor-default' : 'hover:scale-[1.02] shadow-sm'}
                                  group flex flex-col justify-between
                                  ${bgClass}
                                `}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isVisio
                                      ? <Video size={10} className={`${isTermine ? 'text-slate-500' : 'text-white/90'} flex-shrink-0`} />
                                      : <User size={10} className={`${isTermine ? 'text-slate-500' : 'text-white/90'} flex-shrink-0`} />
                                    }
                                    <p className="text-[10px] font-black uppercase truncate leading-tight">
                                      {rdv.patient_nom_complet || rdv.patient_nom || 'Patient'}
                                    </p>
                                  </div>
                                  {!isTermine && (
                                    <PlayCircle
                                      size={14}
                                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                                    />
                                  )}
                                </div>
                                <div>
                                  <p className={`text-[9px] ${isTermine ? 'text-slate-500' : 'text-white/80'} font-medium truncate`}>{rdv.motif}</p>
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 inline-block ${isTermine ? 'bg-slate-300 text-slate-600' : 'bg-white/10 text-white'}`}>
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
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-sm border-l-2 border-l-blue-300" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Présentiel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-600 rounded-sm border-l-2 border-l-indigo-300" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visio</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 border-dashed border-t-2 opacity-40" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heure actuelle</span>
          </div>
        </div>
      </div>

      {/* ✅ AJOUT : MODALE DE CONFIRMATION */}
      {showConfirmModal && selectedRdv && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-white/20">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {selectedRdv.type === 'VISIO' ? (
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Video size={20} className="text-indigo-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                )}
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {selectedRdv.type === 'VISIO' ? 'Téléconsultation' : 'Consultation présentielle'}
                </h3>
              </div>
              <button onClick={handleCancelStart} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm font-medium">
                  {selectedRdv.type === 'VISIO'
                    ? "Vous allez lancer une téléconsultation. Assurez-vous que votre microphone et caméra sont fonctionnels."
                    : "Vous allez commencer la consultation présentielle. Confirmez que le patient est prêt."}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Détails du rendez-vous</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-slate-800">
                    Patient : {selectedRdv.patient_nom_complet || selectedRdv.patient_nom || 'Patient'}
                  </p>
                  <p className="text-sm text-slate-600">
                    📅 {selectedRdv.date} à {selectedRdv.heure?.slice(0, 5)}
                  </p>
                  <p className="text-sm text-slate-600">
                    📝 Motif : {selectedRdv.motif}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={handleCancelStart}
                className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmStart}
                className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
              >
                <PlayCircle size={16} />
                Commencer la consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicalCalendar;