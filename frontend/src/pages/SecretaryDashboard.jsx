import React, { useState, useEffect } from 'react';
import { 
  Inbox, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  Users, Activity, TrendingUp, Phone, Mail, MapPin, 
  Edit3, Check, X, ChevronRight, Eye, RefreshCw, Search,
  Filter, ArrowUpDown, Stethoscope, Video, User
} from 'lucide-react';
import useSecretaryStore from '../store/secretaryStore';
import { toast, confirmAlert } from '../store/uiStore';
import axios from 'axios';
import SecretaryChatWidget from '../components/SecretaryChatWidget';

const SecretaryDashboard = () => {
  const { 
    requests, allAppointments, stats, loading, 
    fetchRequests, confirmRequest, cancelRequest, rescheduleRequest,
    activeTab // ✅ AJOUTÉ
  } = useSecretaryStore();
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', heure: '' });
  const [patientDraft, setPatientDraft] = useState(null);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [occupiedSlots, setOccupiedSlots] = useState([]);

  useEffect(() => { 
    fetchRequests(); 
  },[]);

  // ✅ AJOUT : Récupérer les créneaux occupés quand la date de déplacement change
  useEffect(() => {
    if (rescheduleData.date) {
      const token = localStorage.getItem('token');
      axios.get(`http://localhost:8000/api/appointments/occupied_slots/?date=${rescheduleData.date}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setOccupiedSlots(res.data)).catch(err => console.error(err));
    } else {
      setOccupiedSlots([]);
    }
  }, [rescheduleData.date]);

  // Afficher le profil depuis les données du RDV (fonctionne pour patients officiels ET drafts)
  const showPatientProfile = (rdv) => {
    setSelectedPatientProfile({
      prenom: rdv.patient_prenom || '',
      nom: rdv.patient_nom || '',
      nom_complet: rdv.patient_nom_complet || `${rdv.patient_prenom || ''} ${rdv.patient_nom || ''}`.trim(),
      telephone: rdv.patient_telephone || null,
      cin: rdv.patient_cin || null,
      adresse: null,
      dateNaissance: rdv.patient_date_naissance || null,
      groupeSanguin: rdv.patient_groupe_sanguin || null,
      allergies: rdv.patient_allergies || null,
      genre: rdv.patient_genre || null,
      is_official: !!rdv.patient_id,
    });
    setShowPatientModal(true);
  };

  // Filtrer les RDV
  const filteredAppointments = allAppointments.filter(rdv => {
    const matchesSearch = (rdv.patient_nom_complet || rdv.patient_nom || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rdv.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // KPIs calculés
  const kpiData =[
    { 
      label: "Demandes en attente", 
      value: stats.pending, 
      icon: Inbox, 
      color: "indigo",
      trend: stats.pending > 0 ? "Nouveau" : "À jour"
    },
    { 
      label: "RDV confirmés aujourd'hui", 
      value: stats.today, 
      icon: Calendar, 
      color: "emerald",
      trend: `${stats.today} sur ${stats.total} cette semaine`
    },
    { 
      label: "Patients enregistrés", 
      value: stats.totalPatients || 0, 
      icon: Users, 
      color: "blue",
      trend: "Drafts + Officiels"
    },
    { 
      label: "Taux d'occupation", 
      value: `${stats.occupation || 0}%`, 
      icon: Activity, 
      color: "amber",
      trend: "Créneaux réservés"
    },
  ];

  const handleConfirm = async (rdvId) => {
    const result = await confirmRequest(rdvId);
    if (result.success) {
      // Notification envoyée automatiquement par le backend
      toast.success("RDV confirmé ! Le patient a été notifié par email.");
    } else if (result.error) {
      const errorMessage = typeof result.error === 'object' ? (result.error.error || JSON.stringify(result.error)) : result.error;
      toast.error(errorMessage);
    }
  };

  const handleCancel = async (rdvId) => {
    const isConfirmed = await confirmAlert("Êtes-vous sûr de vouloir annuler ce rendez-vous ? Le patient sera notifié.", "Annuler le rendez-vous");
    if (isConfirmed) {
      await cancelRequest(rdvId);
      toast.info("RDV annulé. Le patient a été notifié.");
    }
  };

  const handleReschedule = async (rdvId) => {
    if (!rescheduleData.date || !rescheduleData.heure) {
      toast.warning("Veuillez sélectionner une date et une heure.");
      return;
    }
    await rescheduleRequest(rdvId, rescheduleData);
    setShowRescheduleModal(false);
    setRescheduleData({ date: '', heure: '' });
    toast.success("RDV déplacé ! Le patient a été notifié.");
  };

  const getStatusBadge = (statut) => {
    const styles = {
      'EN_ATTENTE': 'bg-amber-50 text-amber-600 border-amber-200',
      'CONFIRME': 'bg-emerald-50 text-emerald-600 border-emerald-200',
      'ANNULE': 'bg-red-50 text-red-600 border-red-200',
      'TERMINE': 'bg-blue-50 text-blue-600 border-blue-200'
    };
    return styles[statut] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const getTypeIcon = (type) => {
    return type === 'VISIO' ? <Video size={14} /> : <User size={14} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* ✅ ONGLET DASHBOARD */}
      {activeTab === 'dashboard' && (
        <>
          {/* ── HEADER ── */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
                Tableau de bord
              </h1>
              <p className="text-slate-400 text-xs font-medium mt-1">
                Gestion du cabinet • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button 
              onClick={() => fetchRequests()}
              className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all text-xs font-bold shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>

          {/* ── KPIs ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map(({ label, value, icon: Icon, color, trend }) => (
              <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <TrendingUp size={14} className="text-slate-300" />
                </div>
                <p className="text-slate-800 font-black text-2xl tracking-tighter leading-none mb-1.5">
                  {value}
                </p>
                <p className={`text-[9px] font-black text-${color}-600 uppercase tracking-widest`}>
                  {label}
                </p>
                <p className="text-slate-400 text-[10px] mt-1.5 font-medium">{trend}</p>
              </div>
            ))}
          </div>

          {/* ── DEMANDES EN ATTENTE (Boîte de réception) ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Inbox size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Demandes de rendez-vous</h3>
                  <p className="text-slate-400 text-[11px] font-medium">
                    {stats.pending} en attente de confirmation
                  </p>
                </div>
              </div>
              {stats.pending > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full animate-pulse">
                  {stats.pending} nouvelle{stats.pending > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              {requests.length > 0 ? requests.map((req) => (
                <div key={req.id} className="group bg-slate-50 hover:bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between">
                    {/* Info patient */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                        {req.patient_prenom?.[0] || req.patient_nom?.[0] || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-800 font-black text-base">
                            {req.patient_nom_complet || `${req.patient_prenom} ${req.patient_nom}` || `Patient #${req.user}`}
                          </p>
                          {!req.patient_id && (
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                            <Calendar size={12} /> {req.date}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                            <Clock size={12} /> {req.heure?.slice(0,5)}
                          </span>
                          <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            req.type === 'VISIO' 
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {getTypeIcon(req.type)}
                            {req.type === 'VISIO' ? 'Visio' : 'Présentiel'}
                          </span>
                        </div>
                        <p className="text-indigo-600 text-xs mt-2 font-medium">
                          Motif : {req.motif}
                        </p>
                        {req.statut === 'PROPOSE' && (
                          <span className="mt-2 inline-block bg-purple-50 text-purple-600 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-purple-200">
                            ⏳ En attente réponse patient
                          </span>
                        )}
                        {req.statut === 'PATIENT_ACCEPTE' && (
                          <span className="mt-2 inline-block bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-emerald-200">
                            ✅ Le patient a accepté
                          </span>
                        )}
                        {req.statut === 'PATIENT_REFUSE' && (
                          <span className="mt-2 inline-block bg-red-50 text-red-600 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-red-200">
                            ❌ Le patient a refusé
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => showPatientProfile(req)}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Voir le profil patient"
                      >
                        <Eye size={18} />
                      </button>

                      {req.statut !== 'PROPOSE' && req.statut !== 'PATIENT_REFUSE' && (
                        <button 
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowRescheduleModal(true);
                          }}
                          className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Déplacer le RDV"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}

                      <button 
                        onClick={() => handleCancel(req.id)}
                        className={`p-3 rounded-xl transition-all ${req.statut === 'PATIENT_REFUSE' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                        title="Annuler"
                      >
                        <XCircle size={18} />
                      </button>

                      {req.statut !== 'PROPOSE' && req.statut !== 'PATIENT_REFUSE' && (
                        <button 
                          onClick={() => handleConfirm(req.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                          <Check size={16} /> Confirmer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-16 text-center">
                  <CheckCircle2 size={48} className="text-emerald-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Toutes les demandes ont été traitées !</p>
                  <p className="text-slate-300 text-xs mt-1">La boîte de réception est vide</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ✅ ONGLET AGENDA */}
      {activeTab === 'agenda' && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Agenda du cabinet</h3>
                <p className="text-slate-400 text-xs font-medium">
                  {allAppointments.length} rendez-vous au total
                </p>
              </div>
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 w-48"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRME">Confirmés</option>
                <option value="ANNULE">Annulés</option>
                <option value="TERMINE">Terminés</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="p-5">Patient</th>
                  <th className="p-5">Date & Heure</th>
                  <th className="p-5">Type</th>
                  <th className="p-5">Statut</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAppointments.map(rdv => (
                  <tr key={rdv.id} className="hover:bg-slate-50/50 transition-all text-sm group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                          rdv.patient_id ? 'bg-blue-500' : 'bg-amber-500'
                        }`}>
                          {(rdv.patient_prenom?.[0] || rdv.patient_nom?.[0] || 'P')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {rdv.patient_nom_complet || `${rdv.patient_prenom} ${rdv.patient_nom}` || `Compte #${rdv.user}`}
                          </p>
                          {!rdv.patient_id && (
                            <span className="text-[9px] font-bold text-amber-500 uppercase">Draft</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-slate-700">{rdv.date}</p>
                      <p className="text-xs text-slate-400 font-medium">{rdv.heure?.slice(0,5)}</p>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                        rdv.type === 'VISIO' 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {getTypeIcon(rdv.type)}
                        {rdv.type === 'VISIO' ? 'Visio' : 'Présentiel'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(rdv.statut)}`}>
                        {rdv.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rdv.statut === 'EN_ATTENTE' && (
                          <>
                            <button 
                              onClick={() => handleConfirm(rdv.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Confirmer"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRequest(rdv);
                                setShowRescheduleModal(true);
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Déplacer"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleCancel(rdv.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Annuler"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => showPatientProfile(rdv)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Voir profil"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAppointments.length === 0 && (
              <div className="py-12 text-center">
                <Search size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Aucun rendez-vous trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ ONGLET MESSAGERIE */}
      {activeTab === 'chat' && (
        <SecretaryChatWidget />
      )}

      {/* ✅ ONGLET STATISTIQUES */}
      {activeTab === 'stats' && (() => {
        const totalP = stats.totalPatients || 0;
        const totalRDV = allAppointments.length;
        const completedRDV = allAppointments.filter(r => r.statut === 'TERMINE').length;
        const confirmedRDV = allAppointments.filter(r => r.statut === 'CONFIRME').length;
        const pendingRDV = allAppointments.filter(r => ['EN_ATTENTE', 'PROPOSE', 'PATIENT_ACCEPTE', 'PATIENT_REFUSE'].includes(r.statut)).length;
        const cancelledRDV = allAppointments.filter(r => r.statut === 'ANNULE').length;

        const visioRDV = allAppointments.filter(r => r.type === 'VISIO').length;
        const cabinetRDV = allAppointments.filter(r => r.type === 'PRESENTIEL').length;
        
        const visioPct = totalRDV ? Math.round((visioRDV / totalRDV) * 100) : 0;
        const cabinetPct = totalRDV ? Math.round((cabinetRDV / totalRDV) * 100) : 0;

        // Group motives by frequency
        const motivesFreq = {};
        allAppointments.forEach(r => {
          if (!r.motif) return;
          motivesFreq[r.motif] = (motivesFreq[r.motif] || 0) + 1;
        });
        const topMotives = Object.entries(motivesFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
                Statistiques globales du cabinet
              </h1>
              <p className="text-slate-400 text-xs font-medium mt-1">
                Indicateurs clés de performance et répartition de l'activité du cabinet MedPredict
              </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Patients</p>
                <p className="text-slate-800 font-black text-3xl tracking-tighter leading-none mb-2">{totalP}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-slate-400 text-[10px] mt-2 font-semibold">Patients actifs enregistrés</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Consultations Clôturées</p>
                <p className="text-slate-800 font-black text-3xl tracking-tighter leading-none mb-2">{completedRDV}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalRDV ? Math.round((completedRDV / totalRDV) * 100) : 0}%` }} />
                </div>
                <p className="text-slate-400 text-[10px] mt-2 font-semibold">{totalRDV ? Math.round((completedRDV / totalRDV) * 100) : 0}% de l'ensemble des rendez-vous</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Taux Téléconsultation</p>
                <p className="text-slate-800 font-black text-3xl tracking-tighter leading-none mb-2">{visioPct}%</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${visioPct}%` }} />
                </div>
                <p className="text-slate-400 text-[10px] mt-2 font-semibold">{visioRDV} consultations en vidéo-session</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Rendez-vous programmés</p>
                <p className="text-slate-800 font-black text-3xl tracking-tighter leading-none mb-2">{confirmedRDV}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalRDV ? Math.round((confirmedRDV / totalRDV) * 100) : 0}%` }} />
                </div>
                <p className="text-slate-400 text-[10px] mt-2 font-semibold">{confirmedRDV} dossiers en attente de visite</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Répartition cabinet vs visio */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 lg:col-span-1">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                  <Activity size={14} className="text-indigo-500" />
                  Canal de consultation
                </h3>

                <div className="space-y-4">
                  {/* Visio */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600 flex items-center gap-1.5"><Video size={14} className="text-indigo-500" /> Téléconsultation (Visio)</span>
                      <span className="text-slate-800">{visioRDV} ({visioPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${visioPct}%` }} />
                    </div>
                  </div>

                  {/* Cabinet */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600 flex items-center gap-1.5"><User size={14} className="text-emerald-500" /> Présentiel (Cabinet)</span>
                      <span className="text-slate-800">{cabinetRDV} ({cabinetPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${cabinetPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-semibold text-slate-500 leading-relaxed">
                  💡 Les consultations en présentiel restent majoritaires au cabinet MedPredict, mais la téléconsultation continue sa forte progression pour les suivis de dossiers.
                </div>
              </div>

              {/* Motifs fréquents */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 lg:col-span-2">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                  <TrendingUp size={14} className="text-blue-500" />
                  Motifs de consultation les plus fréquents
                </h3>

                <div className="divide-y divide-slate-50">
                  {topMotives.map(([motif, count], idx) => {
                    const pct = Math.round((count / totalRDV) * 100);
                    return (
                      <div key={motif} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{motif}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="font-extrabold text-slate-800">{count} consultation{count > 1 ? 's' : ''}</span>
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 font-bold border border-slate-100 rounded text-[9px]">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {topMotives.length === 0 && (
                    <div className="py-12 text-center text-slate-400 italic text-xs">
                      Aucune donnée de consultation pour le moment.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Répartition des statuts des RDV */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Cycle de vie des rendez-vous du cabinet
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl text-center">
                  <p className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Finalisés</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{completedRDV}</p>
                </div>
                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-center">
                  <p className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Confirmés</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{confirmedRDV}</p>
                </div>
                <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl text-center">
                  <p className="text-[9px] font-black uppercase text-amber-600 tracking-wider">En attente</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{pendingRDV}</p>
                </div>
                <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl text-center">
                  <p className="text-[9px] font-black uppercase text-red-600 tracking-wider">Annulés</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{cancelledRDV}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODALS (Globales) ── */}
      {showRescheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Déplacer le rendez-vous</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl mb-6">
              <p className="text-sm font-bold text-slate-700">
                {selectedRequest.patient_nom_complet || `Patient #${selectedRequest.user}`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Actuellement prévu le {selectedRequest.date} à {selectedRequest.heure?.slice(0,5)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Nouvelle date</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold"
                />
              </div>
              {rescheduleData.date && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Nouvelle heure</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(h => {
                      const isTaken = occupiedSlots.includes(h);
                      return (
                        <button 
                          key={h} 
                          type="button" 
                          disabled={isTaken} 
                          onClick={() => setRescheduleData({...rescheduleData, heure: h})} 
                          className={`py-3 rounded-lg text-xs font-black border transition-all ${
                            rescheduleData.heure === h ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 
                            isTaken ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 
                            'bg-white text-slate-600 border-slate-200 hover:border-indigo-500'
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <button 
                onClick={() => handleReschedule(selectedRequest.id)}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
              >
                Confirmer le déplacement
              </button>
            </div>
          </div>
        </div>
      )}

      {showPatientModal && selectedPatientProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Profil patient</h3>
              <button onClick={() => { setShowPatientModal(false); setSelectedPatientProfile(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                {selectedPatientProfile.prenom?.[0]}{selectedPatientProfile.nom?.[0]}
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">{selectedPatientProfile.nom_complet}</p>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                  selectedPatientProfile.is_official
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {selectedPatientProfile.is_official ? 'Patient officiel' : 'En attente de 1ère visite'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow icon={Phone} label="Téléphone" value={selectedPatientProfile.telephone} />
              <InfoRow icon={MapPin} label="CIN" value={selectedPatientProfile.cin} />
              <InfoRow icon={Calendar} label="Date de naissance" value={selectedPatientProfile.dateNaissance} />
              <InfoRow icon={Activity} label="Groupe sanguin" value={selectedPatientProfile.groupeSanguin} accent="text-red-500" />
              <InfoRow icon={AlertCircle} label="Allergies" value={selectedPatientProfile.allergies} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-3 text-slate-400">
      <Icon size={14} />
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
    </div>
    <span className={`text-sm font-bold ${accent || 'text-slate-700'}`}>
      {value || <span className="text-slate-300 italic">Non renseigné</span>}
    </span>
  </div>
);

export default SecretaryDashboard;