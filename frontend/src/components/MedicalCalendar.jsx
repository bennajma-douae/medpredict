import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Video, User, PlayCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MedicalCalendar = ({ appointments }) => {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState('Semaine');
  const [now, setNow] = useState(new Date());

  // Mise à jour de l'heure toutes les minutes
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- FONCTION POUR CALCULER LES DATES DE LA SEMAINE ACTUELLE ---
  const getWeekDates = () => {
    const current = new Date(now);
    const week = [];
    // On se place au Lundi de la semaine actuelle
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 5; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push({
        label: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'][i],
        date: nextDay.toISOString().split('T')[0], // Format YYYY-MM-DD pour Django
        dayNum: nextDay.getDate()
      });
    }
    return week;
  };

  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  const days = getWeekDates();

  // Position de la ligne bleue
  const calculateLineTop = () => {
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < 9 || h >= 17) return -100;
    return (h - 9) * 96 + (m / 60) * 96 + 48;
  };

  const getAppointmentsForSlot = (dateStr, hourStr) => {
    return appointments.filter(a => a.date === dateStr && a.heure.startsWith(hourStr));
  };

  return (
    <div className="glass rounded-[40px] border-white/5 overflow-hidden flex flex-col h-[750px] relative">
      
      {/* HEADER DYNAMIQUE */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
            {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {['Aujourd\'hui', 'Semaine'].map(type => (
              <button key={type} onClick={() => setViewType(type)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewType === type ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{type}</button>
            ))}
          </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Heure système</p>
            <p className="text-sm font-bold text-white">{now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        {/* LIGNE TEMPS RÉEL */}
        <div className="absolute left-20 right-0 border-t-2 border-blue-500 border-dashed z-30 group" style={{ top: `${calculateLineTop()}px` }}>
           <div className="w-3 h-3 bg-blue-500 rounded-full -mt-1.5 -ml-1.5 shadow-[0_0_15px_#3b82f6]"></div>
           <div className="absolute left-4 -top-7 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              {now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </div>
        </div>

        <div className="grid grid-cols-[80px_1fr] min-h-full">
          <div className="border-r border-white/5 bg-slate-950/50">
            <div className="h-12 border-b border-white/5"></div>
            {hours.map(h => (
              <div key={h} className="h-24 flex items-start justify-center pt-2 text-[10px] font-bold text-slate-600 border-b border-white/5">{h}</div>
            ))}
          </div>

          <div className={`grid ${viewType === 'Semaine' ? 'grid-cols-5' : 'grid-cols-1'}`}>
            { (viewType === 'Semaine' ? days : [days.find(d => d.date === now.toISOString().split('T')[0]) || days[0]]).map((day) => (
              <div key={day.date} className={`border-r border-white/5 relative last:border-r-0 ${day.date === now.toISOString().split('T')[0] ? 'bg-blue-500/[0.02]' : ''}`}>
                <div className="h-12 bg-white/[0.02] border-b border-white/5 flex flex-col items-center justify-center">
                   <span className={`text-[9px] font-black uppercase ${day.date === now.toISOString().split('T')[0] ? 'text-blue-400' : 'text-slate-500'}`}>{day.label}</span>
                   <span className={`text-sm font-black ${day.date === now.toISOString().split('T')[0] ? 'text-white' : 'text-slate-400'}`}>{day.dayNum}</span>
                </div>

                {hours.map((h) => {
                  const isPause = h === '12:00';
                  const slotAppointments = getAppointmentsForSlot(day.date, h);

                  return (
                    <div key={h} className={`h-24 border-b border-white/5 relative ${isPause ? 'bg-stripe-pattern opacity-20' : ''}`}>
                      {slotAppointments.map(rdv => (
                        <div 
                          key={rdv.id}
                          onClick={() => navigate(`/consultation/${rdv.id}`)}
                          className="absolute inset-1 glass bg-blue-600/90 rounded-xl p-3 border-l-4 border-l-white shadow-2xl cursor-pointer hover:scale-[1.02] transition-all z-20 group"
                        >
                           <div className="flex justify-between items-start">
                              <p className="text-[10px] font-black text-white uppercase truncate">{rdv.patient_nom}</p>
                              <PlayCircle size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                           <p className="text-[9px] text-blue-100 font-bold mt-1 opacity-70 truncate">{rdv.motif}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalCalendar;