import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Users, Calendar, CheckCircle2, Clock, XCircle,
  Stethoscope, TrendingUp, Activity, FileText,
  Video, Building2, BarChart3, AlertCircle, RefreshCw,
  UserCheck, UserX, ClipboardList
} from 'lucide-react';

const API = 'http://localhost:8000/api';

const KpiCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className={`rounded-2xl p-5 border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${bg}`}>
        <Icon size={18} className={color} />
      </div>
    </div>
    <div className="text-3xl font-black text-slate-800 leading-none mb-1">{value}</div>
    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
    {sub && <div className="text-[10px] text-slate-400 mt-1">{sub}</div>}
  </div>
);

const ProgressBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black text-slate-700">{value} <span className="text-slate-400 font-medium">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function Stats() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [rdvRes, patientsRes, consultsRes] = await Promise.all([
        axios.get(`${API}/appointments/`, { headers }),
        axios.get(`${API}/patients/liste-complete/`, { headers }),
        axios.get(`${API}/consultations/`, { headers }),
      ]);
      setAppointments(rdvRes.data || []);
      setPatients(patientsRes.data || []);
      setConsultations(consultsRes.data || []);
      setLastUpdated(new Date());
    } catch (e) {
      setError("Impossible de charger les statistiques. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const stats = useMemo(() => {
    const totalRdv = appointments.length;
    const confirmes = appointments.filter(a => a.statut === 'CONFIRME').length;
    const termines = appointments.filter(a => a.statut === 'TERMINE').length;
    const enAttente = appointments.filter(a => a.statut === 'EN_ATTENTE').length;
    const annules = appointments.filter(a => a.statut === 'ANNULE').length;
    const proposes = appointments.filter(a => a.statut === 'PROPOSE' || a.statut === 'PATIENT_ACCEPTE').length;

    const totalPatients = patients.length;
    const officiels = patients.filter(p => !p.is_draft).length;
    const drafts = patients.filter(p => p.is_draft).length;

    const visio = appointments.filter(a => a.type === 'VISIO').length;
    const cabinet = appointments.filter(a => a.type !== 'VISIO').length;

    // Motifs les plus fréquents
    const motifCount = {};
    appointments.forEach(a => {
      const m = (a.motif || 'Non précisé').trim();
      motifCount[m] = (motifCount[m] || 0) + 1;
    });
    const topMotifs = Object.entries(motifCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Activité par mois (6 derniers mois)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const count = appointments.filter(a => a.date && a.date.startsWith(key)).length;
      monthlyData.push({ label, count, key });
    }

    const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

    // Taux de complétion
    const tauxCompletion = totalRdv > 0 ? Math.round((termines / totalRdv) * 100) : 0;
    const tauxAnnulation = totalRdv > 0 ? Math.round((annules / totalRdv) * 100) : 0;
    const totalConsultations = consultations.length;

    // Jour le plus chargé
    const dayCount = { Lundi: 0, Mardi: 0, Mercredi: 0, Jeudi: 0, Vendredi: 0 };
    appointments.forEach(a => {
      if (a.date) {
        const day = new Date(a.date).getDay();
        const names = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        if (names[day]) dayCount[names[day]]++;
      }
    });
    const maxDay = Math.max(...Object.values(dayCount), 1);

    return {
      totalRdv, confirmes, termines, enAttente, annules, proposes,
      totalPatients, officiels, drafts,
      visio, cabinet,
      topMotifs, monthlyData, maxMonthly,
      tauxCompletion, tauxAnnulation, totalConsultations,
      dayCount, maxDay
    };
  }, [appointments, patients, consultations]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-xs font-bold uppercase tracking-widest">Chargement des statistiques…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-red-400">
      <AlertCircle size={40} />
      <p className="text-sm font-bold">{error}</p>
      <button onClick={fetchAll} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black">
        Réessayer
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Statistiques du Cabinet</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Vue d'ensemble complète · {lastUpdated ? `Mis à jour à ${lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Calendar} label="Total RDV" value={stats.totalRdv}
          sub="Tous statuts confondus" color="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={Users} label="Total Patients" value={stats.totalPatients}
          sub={`${stats.officiels} dossiers · ${stats.drafts} en attente`} color="text-violet-600" bg="bg-violet-50" />
        <KpiCard icon={CheckCircle2} label="Consultations terminées" value={stats.termines}
          sub={`${stats.tauxCompletion}% de complétion`} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon={ClipboardList} label="Dossiers de consultation" value={stats.totalConsultations}
          sub="Enregistrements cliniques" color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Rangée 2 : secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Clock} label="En attente" value={stats.enAttente}
          color="text-amber-600" bg="bg-amber-50" />
        <KpiCard icon={Activity} label="Confirmés" value={stats.confirmes}
          color="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={XCircle} label="Annulés" value={stats.annules}
          sub={`${stats.tauxAnnulation}% d'annulation`} color="text-red-500" bg="bg-red-50" />
        <KpiCard icon={UserCheck} label="Patients officiels" value={stats.officiels}
          sub={`${stats.drafts} encore en brouillon`} color="text-teal-600" bg="bg-teal-50" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Répartition statuts RDV */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl"><BarChart3 size={15} className="text-blue-600" /></div>
            <h2 className="font-black text-sm text-slate-700">Cycle de vie des RDV</h2>
          </div>
          <div className="space-y-3">
            <ProgressBar label="Terminés" value={stats.termines} max={stats.totalRdv} color="bg-emerald-500" />
            <ProgressBar label="Confirmés" value={stats.confirmes} max={stats.totalRdv} color="bg-blue-500" />
            <ProgressBar label="En attente" value={stats.enAttente} max={stats.totalRdv} color="bg-amber-400" />
            <ProgressBar label="Propositions" value={stats.proposes} max={stats.totalRdv} color="bg-violet-400" />
            <ProgressBar label="Annulés" value={stats.annules} max={stats.totalRdv} color="bg-red-400" />
          </div>
        </div>

        {/* Canal de consultation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-teal-50 rounded-xl"><Video size={15} className="text-teal-600" /></div>
            <h2 className="font-black text-sm text-slate-700">Canal de consultation</h2>
          </div>
          <div className="flex items-center justify-center gap-8 py-4">
            {/* Visio */}
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-teal-50 border-4 border-teal-200 flex items-center justify-center mx-auto">
                <Video size={28} className="text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-800">{stats.visio}</div>
              <div className="text-[10px] font-black text-teal-600 uppercase tracking-wider">Téléconsultation</div>
              <div className="text-xs text-slate-400">
                {stats.totalRdv > 0 ? Math.round((stats.visio / stats.totalRdv) * 100) : 0}%
              </div>
            </div>
            <div className="text-slate-200 text-4xl font-thin">|</div>
            {/* Cabinet */}
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center mx-auto">
                <Building2 size={28} className="text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-800">{stats.cabinet}</div>
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Présentiel</div>
              <div className="text-xs text-slate-400">
                {stats.totalRdv > 0 ? Math.round((stats.cabinet / stats.totalRdv) * 100) : 0}%
              </div>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-teal-400 h-full transition-all duration-700"
              style={{ width: stats.totalRdv > 0 ? `${(stats.visio / stats.totalRdv) * 100}%` : '0%' }} />
            <div className="bg-blue-400 h-full transition-all duration-700 flex-1" />
          </div>
        </div>

        {/* Activité mensuelle */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-violet-50 rounded-xl"><TrendingUp size={15} className="text-violet-600" /></div>
            <h2 className="font-black text-sm text-slate-700">Activité des 6 derniers mois</h2>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.monthlyData.map((m, i) => {
              const pct = stats.maxMonthly > 0 ? (m.count / stats.maxMonthly) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[9px] font-black text-slate-500">{m.count}</span>
                  <div className="w-full rounded-t-lg bg-violet-100 relative overflow-hidden" style={{ height: '96px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all duration-700"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-400">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jours les plus chargés */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-50 rounded-xl"><Calendar size={15} className="text-orange-600" /></div>
            <h2 className="font-black text-sm text-slate-700">Charge par jour de la semaine</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.dayCount).map(([day, count]) => (
              <ProgressBar key={day} label={day} value={count} max={stats.maxDay} color="bg-orange-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Motifs fréquents */}
      {stats.topMotifs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-50 rounded-xl"><Stethoscope size={15} className="text-emerald-600" /></div>
            <h2 className="font-black text-sm text-slate-700">Top motifs de consultation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.topMotifs.map(([motif, count], i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                  i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-violet-500' : 'bg-slate-400'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{motif}</p>
                  <p className="text-[10px] text-slate-400">{count} rendez-vous</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-slate-700">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résumé patients */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-violet-50 rounded-xl"><Users size={15} className="text-violet-600" /></div>
          <h2 className="font-black text-sm text-slate-700">Répartition des patients</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <UserCheck size={28} className="text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-black text-slate-800">{stats.officiels}</div>
            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mt-1">Dossiers officiels</div>
            <div className="text-xs text-slate-400 mt-0.5">Patients convertis</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <UserX size={28} className="text-amber-600 mx-auto mb-2" />
            <div className="text-3xl font-black text-slate-800">{stats.drafts}</div>
            <div className="text-[10px] font-black text-amber-600 uppercase tracking-wider mt-1">Brouillons</div>
            <div className="text-xs text-slate-400 mt-0.5">En attente de leur 1er RDV</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <FileText size={28} className="text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-black text-slate-800">{stats.totalConsultations}</div>
            <div className="text-[10px] font-black text-blue-600 uppercase tracking-wider mt-1">Dossiers cliniques</div>
            <div className="text-xs text-slate-400 mt-0.5">Consultations enregistrées</div>
          </div>
        </div>
      </div>
    </div>
  );
}
