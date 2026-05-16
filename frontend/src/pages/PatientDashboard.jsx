import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, FileText, ClipboardList, Plus, 
  LogOut, Clock, AlertCircle, Phone, CreditCard, 
  Droplet, Activity, X, Send, CheckCircle2, Stethoscope, 
  RefreshCw, Download, MapPin, ArrowRight, Info, Video, Edit2,
  Bell, CalendarCheck, ShieldAlert, Check, Timer
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast, confirmAlert } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patientInfo, setPatientInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBooking, setShowBooking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // ✅ AJOUT : État pour la notification toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({ 
    nom: '', prenom: '', telephone: '', cin: '', adresse: '',
    dateNaissance: '', genre: 'M', groupeSanguin: '', allergies: '', antecedents: ''
  });
  
  const [rdvData, setRdvData] = useState({ date: '', heure: '', motif: '', type: 'PRESENTIEL', medecin: null });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  },[]);

  const fetchData = async () => {
    if (!user?.email_verified) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const resRdv = await axios.get('http://localhost:8000/api/appointments/mes-rdv/', config);
      setAppointments(resRdv.data);

      try {
        const resProfile = await axios.get('http://localhost:8000/api/patients/me/', config);
        const profile = resProfile.data;
        
        setHasProfile(profile.is_official === true);
        setPatientInfo(profile);

        setFormData({ 
            nom: profile.nom || '', prenom: profile.prenom || '', 
            telephone: profile.telephone || '', cin: profile.cin || '',
            adresse: profile.adresse || '', dateNaissance: profile.dateNaissance || '',
            genre: profile.genre || 'M', groupeSanguin: profile.groupeSanguin || '',
            allergies: profile.allergies || '', antecedents: profile.antecedents || ''
        });
      } catch (e) {
        setHasProfile(false);
        setPatientInfo(null);
      }

      const resUsers = await axios.get('http://localhost:8000/api/users/', config);
      const doctor = resUsers.data.find(u => u.role === 'MEDECIN');
      if (doctor) setRdvData(prev => ({ ...prev, medecin: doctor.id }));

    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  // ✅ AJOUT : Vérifier les nouveaux RDV visio confirmés pour afficher la notification
  useEffect(() => {
    const visioConfirmed = appointments.filter(
      a => a.type === 'VISIO' && a.statut === 'CONFIRME'
    );
    
    if (visioConfirmed.length > 0 && !showToast) {
      setToastMessage(`📹 ${visioConfirmed.length} téléconsultation(s) disponible(s) !`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 8000);
    }
  }, [appointments]);

  // ✅ AJOUT : Fonction pour rejoindre la téléconsultation
  const joinTeleconsultation = (appointment) => {
    if (!appointment.visio_room_id) {
      toast.warning("Le lien de téléconsultation n'est pas encore disponible. Veuillez attendre la confirmation du médecin.");
      return;
    }
    
    const patientName = encodeURIComponent(patientInfo?.prenom || user?.username || 'Patient');
    const doctorName = encodeURIComponent(appointment.medecin_nom || 'Médecin');
    const teleconsultUrl = `http://localhost:5000/consultation?room=${appointment.visio_room_id}&role=patient&rdvId=${appointment.id}&patient=${patientName}&doctor=${doctorName}`;
    
    window.open(teleconsultUrl, '_blank');
  };

  // DERIVATION DES DONNEES
  const activeAppointments = appointments.filter(a => a.statut === 'EN_ATTENTE' || a.statut === 'CONFIRME');
  const upcomingRdv = activeAppointments.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const pastAppointments = appointments.filter(a => a.statut === 'TERMINE').sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Calcul de l'âge
  const calcAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const today = new Date();
    const born = new Date(dateNaissance);
    let age = today.getFullYear() - born.getFullYear();
    const m = today.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
    return age;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch('http://localhost:8000/api/patients/me/update/', formData, config);
      setIsEditing(false);
      fetchData();
      toast.success("Profil mis à jour !");
    } catch (err) { toast.error("Erreur lors de la mise à jour."); }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/appointments/', { ...rdvData, user: user.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowBooking(false);
      fetchData();
      toast.success("Demande de rendez-vous envoyée !");
    } catch (err) { toast.error(err.response?.data?.error || err.response?.data?.heure || "Erreur."); }
  };

  const downloadPDF = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/patients/me/download-dossier/', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.body.appendChild(document.createElement('a'));
      link.href = url;
      link.download = `Dossier_Medical_${patientInfo?.nom || 'Patient'}.pdf`;
      link.click();
    } catch (e) { toast.error("Erreur PDF"); }
  };

  const handleAcceptReschedule = async (id) => {
    try {
      await axios.patch(`http://localhost:8000/api/appointments/${id}/accepter_proposition/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      toast.success("Nouvel horaire accepté !");
    } catch (e) {
      toast.error("Erreur lors de l'acceptation.");
    }
  };

  const handleRejectReschedule = async (id) => {
    const isConfirmed = await confirmAlert("Voulez-vous vraiment refuser ce nouvel horaire ?", "Refuser la proposition");
    if (isConfirmed) {
      try {
        await axios.patch(`http://localhost:8000/api/appointments/${id}/refuser_proposition/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
        toast.info("Proposition refusée.");
      } catch (e) {
        toast.error("Erreur lors du refus.");
      }
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-blue-600 font-bold text-sm">Chargement...</div>;

  if (user && !user.email_verified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg text-center border border-slate-100">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2 text-slate-800">Email non vérifié</h1>
          <p className="text-slate-500 mb-6 text-sm">Veuillez valider votre adresse <b>{user.email}</b>.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all">
            <RefreshCw size={16} className="inline mr-2"/> J'ai vérifié
          </button>
          <button onClick={() => { logout(); navigate('/'); }} className="mt-4 text-slate-400 font-bold text-xs uppercase">Déconnexion</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-6 shadow-sm z-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
            <Stethoscope size={20} />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tight italic">MedPredict</span>
        </div>
        
        <nav className="flex-1 space-y-1">
           <SidebarItem icon={Activity} label="Aperçu" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
           <SidebarItem icon={User} label="Mes Infos" active={activeTab === 'infos'} onClick={() => setActiveTab('infos')} />
           <SidebarItem icon={Calendar} label="Mes RDV" active={activeTab === 'rdv'} onClick={() => setActiveTab('rdv')} />
           <SidebarItem icon={FileText} label="Mon Dossier" active={activeTab === 'dossier'} onClick={() => setActiveTab('dossier')} />
        </nav>
        
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase p-3 rounded-xl hover:bg-red-50 transition-all mt-auto">
          <LogOut size={16} /> Déconnexion
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8 relative z-10">
           <div>
             <h1 className="text-2xl font-black text-slate-800 tracking-tight">
               Bonjour, {patientInfo?.prenom || user?.username || 'Patient'}
             </h1>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                {hasProfile ? 'Dossier médical actif' : 'En attente de première visite'}
            </p>
           </div>
           
           <div className="flex items-center gap-4">
             {/* NOTIFICATIONS BELL */}
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all relative"
                >
                  <Bell size={18} />
                  {activeAppointments.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vos Rendez-vous actifs</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {activeAppointments.length > 0 ? activeAppointments.map(a => (
                        <div key={a.id} onClick={() => setActiveTab('rdv')} className="p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border-b border-transparent hover:border-slate-100">
                          <p className="text-xs font-bold text-slate-700">Prévu le {a.date}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Statut : <span className={a.statut === 'CONFIRME' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>{a.statut}</span>
                          </p>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-400 p-4 text-center">Aucune notification.</p>
                      )}
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-bold text-sm tabular-nums text-slate-600">
               {currentTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
             </div>
           </div>
        </header>

        {/* ========== DASHBOARD DYNAMIQUE ========== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* ETAT 1 : NOUVEAU PATIENT (AUCUN RDV PRIS) */}
            {!hasProfile && !upcomingRdv && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                  <div className="relative z-10 max-w-lg">
                    <h2 className="text-2xl font-black mb-2 tracking-tight">Bienvenue sur MedPredict</h2>
                    <p className="text-blue-100 text-sm mb-8 leading-relaxed">
                      Votre compte est créé. Pour générer votre dossier médical numérique et accéder à l'ensemble de nos services, veuillez planifier votre première consultation.
                    </p>
                    <button 
                      onClick={() => setShowBooking(true)} 
                      className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      <Plus size={16}/> Prendre mon 1er RDV
                    </button>
                  </div>
                  <Stethoscope className="absolute -right-10 -bottom-10 opacity-10" size={180} />
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Votre progression</h3>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-blue-500 -z-10"></div>
                    
                    <div className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"><Check size={16}/></div>
                      <span className="text-[10px] font-bold text-slate-600">Inscription</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"><Check size={16}/></div>
                      <span className="text-[10px] font-bold text-slate-600">Email vérifié</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"><Timer size={16}/></div>
                      <span className="text-[10px] font-bold text-slate-400">1er Rendez-vous</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAT 2 : PATIENT NON OFFICIEL MAIS AVEC UN RDV PRIS (EN ATTENTE DE 1ERE VISITE) */}
            {!hasProfile && upcomingRdv && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="relative z-10 w-full md:w-2/3">
                    <div className="flex items-center gap-2 mb-3">
                      {upcomingRdv.statut === 'CONFIRME' ? (
                        <span className="bg-emerald-500/20 text-emerald-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 size={12}/> RDV Confirmé</span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/30 flex items-center gap-1"><Timer size={12}/> En attente</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Préparation de votre visite</h2>
                    <p className="text-indigo-100 text-sm">
                      Votre dossier médical sera généré par le médecin à l'issue de cette consultation.
                    </p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center w-full md:w-auto min-w-[220px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Créneau réservé</p>
                    <p className="text-4xl font-black mb-1">{upcomingRdv.heure.slice(0,5)}</p>
                    <p className="text-sm font-bold text-indigo-100">{upcomingRdv.date}</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><Info size={24}/></div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm mb-1">Que dois-je préparer ?</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Pensez à vous munir de votre carte d'identité (CIN), de vos anciennes analyses ou radiographies si vous en avez, et arrivez 10 minutes avant l'heure prévue pour finaliser votre dossier à l'accueil.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAT 3 : PATIENT OFFICIEL (A DÉJÀ CONSULTE) */}
            {hasProfile && (
              <div className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  
                  {/* Carte Prochain RDV - AVEC BOUTON TELECONSULTATION */}
                  <div className="col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prochain rendez-vous</h3>
                      {upcomingRdv ? (
                        <div>
                          <p className="text-2xl font-black text-slate-800 tracking-tight mt-2 mb-2">
                            {upcomingRdv.date} à {upcomingRdv.heure.slice(0,5)}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase ${upcomingRdv.statut === 'CONFIRME' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {upcomingRdv.statut}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Motif : {upcomingRdv.motif}</span>
                          </div>
                          
                          {/* ✅ BOUTON TELECONSULTATION DANS LA CARTE PROCHAIN RDV */}
                          {upcomingRdv.type === 'VISIO' && upcomingRdv.statut === 'CONFIRME' && (
                            <button
                              onClick={() => joinTeleconsultation(upcomingRdv)}
                              className="mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg"
                            >
                              <Video size={14} />
                              Rejoindre la téléconsultation
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-bold text-slate-600 mt-2 mb-4">Aucun rendez-vous prévu</p>
                          <button 
                            onClick={() => setShowBooking(true)} 
                            className="bg-blue-50 text-blue-600 border border-blue-100 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                          >
                            <Plus size={14} /> Planifier
                          </button>
                        </div>
                      )}
                    </div>
                    <CalendarCheck size={100} className="text-slate-50 opacity-50 absolute -right-4 -bottom-4" />
                  </div>

                  {/* Carte "Fiche Médicale" */}
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Activity size={16} />
                      </div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiche Médicale</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-colors">
                        <span className="text-xs font-bold text-slate-500">Âge patient</span>
                        <span className="text-sm font-black text-slate-800">{calcAge(patientInfo.dateNaissance) || '--'} ans</span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-colors">
                        <span className="text-xs font-bold text-slate-500">Groupe sanguin</span>
                        <span className="text-sm font-black text-red-500 flex items-center gap-1.5"><Droplet size={14}/> {patientInfo.groupeSanguin || '--'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-colors">
                        <span className="text-xs font-bold text-slate-500">Allergies</span>
                        {patientInfo.allergies ? (
                           <span className="text-xs font-bold text-amber-500 max-w-[100px] text-right truncate flex items-center gap-1.5"><ShieldAlert size={14}/> {patientInfo.allergies}</span>
                        ) : (
                           <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 size={14}/> Aucune</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Historique Récent */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activité Récente</h3>
                    <button onClick={() => setActiveTab('dossier')} className="text-blue-600 text-[10px] font-bold uppercase hover:underline">Voir tout</button>
                  </div>
                  
                  {pastAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {pastAppointments.slice(0, 3).map(rdv => (
                        <div key={rdv.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><CheckCircle2 size={16}/></div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Consultation terminée</p>
                            <p className="text-[10px] text-slate-400">{rdv.date} • {rdv.motif}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Aucun historique disponible.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== MES INFOS ========== */}
        {activeTab === 'infos' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Profil & Données</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${isEditing ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}
              >
                {isEditing ? <><X size={14}/> Annuler</> : <><Edit2 size={14}/> Modifier</>}
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="grid md:grid-cols-2 gap-6">
              <InfoField label="Nom" value={formData.nom} isEditing={isEditing} onChange={e => setFormData({...formData, nom: e.target.value})} />
              <InfoField label="Prénom" value={formData.prenom} isEditing={isEditing} onChange={e => setFormData({...formData, prenom: e.target.value})} />
              <InfoField label="CIN" value={formData.cin} isEditing={isEditing} icon={CreditCard} onChange={e => setFormData({...formData, cin: e.target.value})} />
              <InfoField label="Téléphone" value={formData.telephone} isEditing={isEditing} icon={Phone} onChange={e => setFormData({...formData, telephone: e.target.value})} />

              {/* Date de naissance */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de naissance</label>
                {isEditing ? (
                  <input type="date" value={formData.dateNaissance} onChange={e => setFormData({...formData, dateNaissance: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-transparent">
                    <Calendar size={16} className="text-slate-400"/>
                    <span className="font-bold text-slate-700 text-sm">{formData.dateNaissance ? new Date(formData.dateNaissance).toLocaleDateString('fr-FR') : "---"}</span>
                  </div>
                )}
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genre</label>
                {isEditing ? (
                  <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-transparent">
                    <User size={16} className="text-slate-400"/>
                    <span className="font-bold text-slate-700 text-sm">{formData.genre === 'F' ? 'Féminin' : formData.genre === 'M' ? 'Masculin' : "---"}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <InfoField label="Adresse" value={formData.adresse} isEditing={isEditing} icon={MapPin} onChange={e => setFormData({...formData, adresse: e.target.value})} />
              </div>

              {/* Groupe sanguin */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Groupe sanguin</label>
                {isEditing ? (
                  <select value={formData.groupeSanguin} onChange={e => setFormData({...formData, groupeSanguin: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                    <option value="">-- Sélectionner --</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-transparent">
                    <Droplet size={16} className="text-red-400"/>
                    <span className="font-bold text-slate-700 text-sm">{formData.groupeSanguin || "---"}</span>
                  </div>
                )}
              </div>

              <InfoField label="Allergies connues" value={formData.allergies} isEditing={isEditing} onChange={e => setFormData({...formData, allergies: e.target.value})} />

              <div className="md:col-span-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antécédents médicaux</label>
                  {isEditing ? (
                    <textarea value={formData.antecedents} onChange={e => setFormData({...formData, antecedents: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700 min-h-[100px] resize-none" placeholder="Antécédents chirurgicaux, maladies chroniques..." />
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-transparent min-h-[60px]">
                      <span className="font-bold text-slate-700 text-sm whitespace-pre-wrap">{formData.antecedents || "Aucun antécédent renseigné."}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="md:col-span-2 pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all">
                    Enregistrer les modifications
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ========== RDV ========== */}
        {activeTab === 'rdv' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Historique & Réservations</h2>
              <button onClick={() => setShowBooking(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all">
                <Plus size={16}/> Nouveau RDV
              </button>
            </div>
            <div className="grid gap-4">
              {appointments.map(a => {
                // ✅ Vérifier si c'est une VISIO confirmée
                const isVisioConfirmed = a.type === 'VISIO' && a.statut === 'CONFIRME';
                const canJoinVisio = isVisioConfirmed && a.visio_room_id;
                
                return (
                  <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-blue-600 border border-slate-100 group-hover:border-blue-200 transition-colors">
                          <span className="text-lg font-black leading-none">{a.date.split('-')[2]}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{a.date.split('-')[1]}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{a.motif}</p>
                          <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
                            <Clock size={12}/> {a.heure?.slice(0, 5)} 
                            <span className="opacity-50">•</span> 
                            {a.type === 'VISIO' ? '📹 Visio' : '🏥 Présentiel'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-4 py-1.5 rounded border text-[9px] font-black uppercase tracking-widest ${
                          a.statut === 'CONFIRME' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          a.statut === 'TERMINE' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                          a.statut === 'ANNULE' ? 'bg-red-50 text-red-600 border-red-200' :
                          a.statut === 'PROPOSE' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {a.statut === 'EN_ATTENTE' ? 'En attente' : a.statut === 'PROPOSE' ? 'Action requise' : a.statut}
                        </span>
                        
                        {/* ✅ BOUTON REJOINDRE LA TELECONSULTATION */}
                        {canJoinVisio && (
                          <button
                            onClick={() => joinTeleconsultation(a)}
                            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-indigo-500/30 animate-pulse"
                          >
                            <Video size={14} />
                            Rejoindre la consultation
                          </button>
                        )}
                        
                        {/* ✅ Avertissement pour VISIO en attente */}
                        {a.type === 'VISIO' && a.statut === 'EN_ATTENTE' && (
                          <span className="mt-2 text-amber-600 text-[8px] font-bold uppercase flex items-center gap-1">
                            <AlertCircle size={10} />
                            En attente de confirmation
                          </span>
                        )}

                        {/* ✅ Actions pour le statut PROPOSE */}
                        {a.statut === 'PROPOSE' && (
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => handleAcceptReschedule(a.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm">
                              <Check size={12} /> Accepter
                            </button>
                            <button onClick={() => handleRejectReschedule(a.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-100 transition-all flex items-center gap-1 border border-red-200">
                              <X size={12} /> Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {appointments.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
                  <Calendar size={40} className="mx-auto mb-4 opacity-20"/>
                  <p className="font-bold text-sm">Aucun rendez-vous planifié.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== DOSSIER ========== */}
        {activeTab === 'dossier' && (
          <div className="bg-white p-10 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm animate-in fade-in">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Dossier Médical</h3>
              <p className="text-slate-500 text-sm">
                {hasProfile ? 'Votre historique clinique complet au format sécurisé.' : 'Votre dossier officiel sera généré après la consultation initiale.'}
              </p>
            </div>
            {hasProfile ? (
              <button onClick={downloadPDF} className="bg-slate-800 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-lg">
                <Download size={18} /> Télécharger le PDF
              </button>
            ) : (
              <span className="text-amber-600 font-black text-[10px] uppercase tracking-widest bg-amber-50 px-4 py-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                <ShieldAlert size={14}/> En attente de création
              </span>
            )}
          </div>
        )}
      </main>

      {/* MODAL DE PRISE DE RDV */}
      {showBooking && (
        <BookingModal onClose={() => setShowBooking(false)} onSubmit={handleBooking} setData={setRdvData} data={rdvData} token={token} />
      )}

      {/* ✅ TOAST NOTIFICATION POUR TELECONSULTATION */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-5 duration-300">
          <div className="bg-indigo-600 text-white rounded-2xl shadow-2xl p-4 max-w-sm border border-indigo-400">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Video size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Téléconsultation prête</p>
                <p className="text-xs text-indigo-100 mt-1">{toastMessage}</p>
                <button 
                  onClick={() => {
                    setShowToast(false);
                    setActiveTab('rdv');
                  }}
                  className="mt-3 text-xs font-black uppercase tracking-widest text-white underline underline-offset-2"
                >
                  Voir mes rendez-vous →
                </button>
              </div>
              <button onClick={() => setShowToast(false)} className="text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================== COMPOSANTS RÉUTILISABLES ======================

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-5 py-4 rounded-xl cursor-pointer transition-all text-sm font-bold ${
      active ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
  }`}>
    <Icon size={18} className={active ? "text-blue-600" : ""} /> 
    <span>{label}</span>
  </div>
);

const InfoField = ({ label, value, isEditing, onChange, icon: Icon }) => {
  const safeValue = value || '';
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {isEditing ? (
        <input type="text" value={safeValue} onChange={onChange} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
      ) : (
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-transparent">
          {Icon && <Icon size={16} className="text-slate-400"/>}
          <span className="font-bold text-slate-700 text-sm">{safeValue || "---"}</span>
        </div>
      )}
    </div>
  );
};

const BookingModal = ({ onClose, onSubmit, setData, data, token }) => {
  const[occupied, setOccupied] = useState([]);
  const slots =["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  useEffect(() => {
    if (data.date) {
      axios.get(`http://localhost:8000/api/appointments/occupied_slots/?date=${data.date}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setOccupied(res.data));
    }
  },[data.date, token]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white p-8 rounded-3xl max-w-md w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors">
          <X size={20}/>
        </button>
        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-8">Nouveau rendez-vous</h2>
        
        <form onSubmit={onSubmit} className="space-y-5">
          {/* SÉLECTION DU TYPE DE RDV */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Type de consultation</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setData({...data, type: 'PRESENTIEL'})}
                className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-black border transition-all ${
                  data.type === 'PRESENTIEL' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200'
                }`}
              >
                <User size={16} /> Au cabinet
              </button>
              <button 
                type="button"
                onClick={() => setData({...data, type: 'VISIO'})}
                className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-black border transition-all ${
                  data.type === 'VISIO' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <Video size={16} /> En Visio
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Date souhaitée</label>
            <input type="date" required min={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" onChange={e => setData({...data, date: e.target.value})} />
          </div>
          
          {data.date && (
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Créneau horaire</label>
              <div className="grid grid-cols-4 gap-2">
                {slots.map(h => {
                  const isTaken = occupied.includes(h);
                  return (
                    <button key={h} type="button" disabled={isTaken} onClick={() => setData({...data, heure: h})} 
                      className={`py-3 rounded-lg text-xs font-black border transition-all ${
                        data.heure === h ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 
                        isTaken ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 
                        'bg-white text-slate-600 border-slate-200 hover:border-blue-500'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Motif</label>
            <textarea placeholder="Décrivez brièvement le motif..." required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 min-h-[100px] resize-none text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium" onChange={e => setData({...data, motif: e.target.value})} />
          </div>
          
          <button type="submit" disabled={!data.heure || !data.date} className="w-full bg-blue-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all disabled:opacity-30 disabled:hover:bg-blue-600 disabled:cursor-not-allowed mt-4">
            Confirmer la demande
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientDashboard;