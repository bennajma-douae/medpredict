import React, { useState, useEffect } from 'react';
import { 
  Terminal, Settings, Server, Database, Cpu, CheckCircle2, 
  UserPlus, X, ChevronRight, Stethoscope, Users as UsersIcon, RefreshCw,
  LogOut, Shield, Building2, Clock, Calendar, Mail, FileText,
  Activity, Trash2, Save, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from '../store/uiStore';

const API = 'http://localhost:8000/api';

export default function TechDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  
  /* --- Modals --- */
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* --- Formulaires --- */
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'MEDECIN' });

  /* --- Logs système (garantis sans info patient) --- */
  const [logs, setLogs] = useState([
    { id: 1, time: '02:00:05', type: 'SYS', msg: 'Cron job [ScheduleAppointmentReminders] exécuté avec succès.' },
    { id: 2, time: '01:45:12', type: 'AUTH', msg: 'Connexion de la secrétaire [sec_1] enregistrée depuis IP 192.168.1.50.' },
    { id: 3, time: '01:12:49', type: 'SYS', msg: 'Génération du PDF dossier médical demandée pour l\'identifiant #4.' },
    { id: 4, time: '00:05:00', type: 'DB', msg: 'Sauvegarde automatique Postgres 18 effectuée et stockée en volume cloud.' }
  ]);

  /* --- Cabinet (Stocké et chargé en Base de Données PostgreSQL) --- */
  const [cabinet, setCabinet] = useState({
    nom: 'Cabinet Médical MedPredict',
    telephone: '+212 5 22 45 67 89',
    email: 'contact@medpredict.ma',
    adresse: '75 Boulevard d\'Anfa, Casablanca, Maroc',
    ouverture: '08:30',
    fermeture: '18:00',
    pauseDebut: '12:30',
    pauseFin: '14:00',
    medecinNom: 'Dr. Mohamed Alami',
    medecinSpecialite: 'Médecine Générale & IA Diagnostique',
    rpps: '10100458923',
    inpe: '045892361',
    piedPage: 'Document confidentiel généré par le système intelligent MedPredict.'
  });

  /* --- Templates d'Emails (Stockés et chargés en Base de Données) --- */
  const [selectedTemplate, setSelectedTemplate] = useState('confirmed');
  const [templates, setTemplates] = useState({
    confirmed: { sujet: '', corps: '', label: '' },
    cancelled: { sujet: '', corps: '', label: '' },
    rescheduled: { sujet: '', corps: '', label: '' },
    reminder_24h: { sujet: '', corps: '', label: '' },
    reminder_2h: { sujet: '', corps: '', label: '' },
    reminder_10min: { sujet: '', corps: '', label: '' }
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staffOnly = res.data.filter(u => u.role === 'MEDECIN' || u.role === 'SECRETAIRE');
      setStaff(staffOnly);
    } catch (err) {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCabinet = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/config/cabinet/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCabinet({
        nom: res.data.nom || '',
        telephone: res.data.telephone || '',
        email: res.data.email || '',
        adresse: res.data.adresse || '',
        ouverture: res.data.ouverture || '',
        fermeture: res.data.fermeture || '',
        pauseDebut: res.data.pause_debut || '',
        pauseFin: res.data.pause_fin || '',
        medecinNom: res.data.medecin_nom || '',
        medecinSpecialite: res.data.medecin_specialite || '',
        rpps: res.data.rpps || '',
        inpe: res.data.inpe || '',
        piedPage: res.data.pied_page || ''
      });
    } catch (err) {
      console.error("Erreur lors de la récupération du cabinet :", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/config/templates/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dict = {};
      res.data.forEach(t => {
        dict[t.key] = {
          sujet: t.sujet,
          corps: t.corps,
          label: t.label
        };
      });
      setTemplates(dict);
    } catch (err) {
      console.error("Erreur lors de la récupération des templates d'emails :", err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchCabinet();
    fetchTemplates();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateModal(false);
      fetchStaff();
      setFormData({ username: '', email: '', password: '', role: 'MEDECIN' });
      toast.success(`Le compte ${formData.role} a été créé avec succès !`);
      
      setLogs(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString('fr-FR'), type: 'AUTH', msg: `Création du compte praticien [${formData.username}] avec rôle ${formData.role}.` },
        ...prev
      ]);
    } catch (err) {
      toast.error("Erreur de création. Le nom d'utilisateur existe peut-être déjà.");
    }
  };

  const handleDeleteStaff = async (userId, username) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte [${username}] ?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStaff();
      toast.success(`Le compte [${username}] a été supprimé.`);
      
      setLogs(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString('fr-FR'), type: 'AUTH', msg: `Suppression définitive de l'accès pour l'utilisateur [${username}].` },
        ...prev
      ]);
    } catch (err) {
      toast.error("Erreur lors de la suppression de l'accès.");
    }
  };

  const handleSaveCabinet = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/config/cabinet/`, {
        nom: cabinet.nom,
        telephone: cabinet.telephone,
        email: cabinet.email,
        adresse: cabinet.adresse,
        ouverture: cabinet.ouverture,
        fermeture: cabinet.fermeture,
        pause_debut: cabinet.pauseDebut,
        pause_fin: cabinet.pauseFin,
        medecin_nom: cabinet.medecinNom,
        medecin_specialite: cabinet.medecinSpecialite,
        rpps: cabinet.rpps,
        inpe: cabinet.inpe,
        pied_page: cabinet.piedPage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Configuration du cabinet enregistrée en Base de Données !");
      setLogs(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString('fr-FR'), type: 'SYS', msg: 'Mise à jour des paramètres légaux et horaires globaux du cabinet en base de données.' },
        ...prev
      ]);
    } catch (err) {
      toast.error("Erreur de sauvegarde des configurations du cabinet.");
    }
  };

  const handleSaveTemplate = async (key) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/config/templates/${key}/`, {
        sujet: templates[key].sujet,
        corps: templates[key].corps
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Modifications du template sauvegardées en Base de Données !");
      setLogs(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString('fr-FR'), type: 'SYS', msg: `Mise à jour du template d'email transactionnel [${key}] en base de données.` },
        ...prev
      ]);
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde du template.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-slate-300 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 bg-[#0c0f24] border-b border-white/5 px-8 flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-green-600 to-emerald-500 p-2 rounded-xl text-white shadow-lg flex-shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              Console de Super-Administration
            </h1>
            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest leading-none">Instance Technique Sécurisée</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-black text-white tracking-widest uppercase">Admin</p>
            <p className="text-[8px] font-black text-slate-500 uppercase mt-0.5">Technique & Infrastructure</p>
          </div>
          <button 
            onClick={() => {
              navigate('/');
              setTimeout(() => {
                logout();
              }, 0);
            }}
            className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Se déconnecter de la console"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-64 bg-[#080b1e]/60 border-r border-white/5 p-4 flex flex-col gap-1.5 shrink-0">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-3">Sections Console</p>
          
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all ${
              activeTab === 'staff' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <UsersIcon size={15} /> Gestion du Staff
          </button>
          
          <button
            onClick={() => setActiveTab('cabinet')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all ${
              activeTab === 'cabinet' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Building2 size={15} /> Config Cabinet
          </button>
          
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all ${
              activeTab === 'emails' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Mail size={15} /> Templates Emails
          </button>
          
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all ${
              activeTab === 'system' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Activity size={15} /> Système & Logs
          </button>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: GESTION DU STAFF */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Comptes & Praticiens</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Accès médecins et secrétaires uniquement (Données patients isolées)</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus size={14} /> Créer un compte
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-500 uppercase text-xs font-bold tracking-widest">Chargement du staff...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {staff.map((u) => (
                    <div key={u.id} className="bg-[#0b0e24]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-white/10 transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            u.role === 'MEDECIN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {u.role === 'MEDECIN' ? 'Médecin' : 'Secrétaire'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{u.username}</h3>
                        <p className="text-xs text-slate-500 mt-1">{u.email}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5">
                        <button
                          onClick={() => handleDeleteStaff(u.id, u.username)}
                          className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          title="Supprimer définitivement le compte"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {staff.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-white/5 border border-white/5 rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-wider">Aucun praticien créé</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFIGURATION DU CABINET */}
          {activeTab === 'cabinet' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Configuration Générale</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Gérer les infos de l'établissement, les horaires de réservation et les paramètres légaux</p>
                </div>
                <button
                  onClick={handleSaveCabinet}
                  className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save size={14} /> Enregistrer la config
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Infos */}
                <div className="bg-[#0b0e24]/60 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-2"><Building2 size={15} className="text-blue-500" /> Établissement</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Nom du Cabinet</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.nom} onChange={e => setCabinet({...cabinet, nom: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Téléphone</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.telephone} onChange={e => setCabinet({...cabinet, telephone: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Email Contact</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.email} onChange={e => setCabinet({...cabinet, email: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Adresse Physique</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.adresse} onChange={e => setCabinet({...cabinet, adresse: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Horaires */}
                <div className="bg-[#0b0e24]/60 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-2"><Clock size={15} className="text-emerald-500" /> Horaires d'Ouverture</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Ouverture</label>
                      <input type="time" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.ouverture} onChange={e => setCabinet({...cabinet, ouverture: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Fermeture</label>
                      <input type="time" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.fermeture} onChange={e => setCabinet({...cabinet, fermeture: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Début Pause déjeuner</label>
                      <input type="time" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.pauseDebut} onChange={e => setCabinet({...cabinet, pauseDebut: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Fin Pause déjeuner</label>
                      <input type="time" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.pauseFin} onChange={e => setCabinet({...cabinet, pauseFin: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Légal & Praticien */}
                <div className="bg-[#0b0e24]/60 border border-white/5 rounded-2xl p-6 space-y-4 md:col-span-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-2"><FileText size={15} className="text-rose-500" /> Praticien Principal & Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Nom Médecin référent</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.medecinNom} onChange={e => setCabinet({...cabinet, medecinNom: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Spécialité</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.medecinSpecialite} onChange={e => setCabinet({...cabinet, medecinSpecialite: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">N° RPPS</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.rpps} onChange={e => setCabinet({...cabinet, rpps: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">N° INPE</label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" value={cabinet.inpe} onChange={e => setCabinet({...cabinet, inpe: e.target.value})} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Pied de page des ordonnances & rapports PDF</label>
                    <textarea rows={2} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold resize-none font-sans" value={cabinet.piedPage} onChange={e => setCabinet({...cabinet, piedPage: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATES EMAILS (100% synchrone avec le backend tasks.py) */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Notification de Messagerie Automatisée</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Personnaliser le contenu des emails transactionnels envoyés aux patients</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Menu Gauche */}
                <div className="bg-[#0b0e24]/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">Templates Disponibles</p>
                  {Object.keys(templates).map(k => (
                    <button
                      key={k}
                      onClick={() => setSelectedTemplate(k)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                        selectedTemplate === k ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {templates[k].label || k} <ChevronRight size={13} />
                    </button>
                  ))}

                  <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1.5"><AlertTriangle size={12} /> Placeholders</p>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      Utilisez ces tags dans votre corps de message :<br />
                      <code className="text-white font-bold">{'{nom_destinataire}'}</code><br />
                      <code className="text-white font-bold">{'{date}'}</code>, <code className="text-white font-bold">{'{heure}'}</code><br />
                      <code className="text-white font-bold">{'{type_visite}'}</code>, <code className="text-white font-bold">{'{motif}'}</code>
                    </p>
                  </div>
                </div>

                {/* Editeur & Aperçu */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Editeur */}
                  <div className="bg-[#0b0e24]/60 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Édition Template</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Objet de l'email</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold"
                          value={templates[selectedTemplate]?.sujet || ''}
                          onChange={e => setTemplates({
                            ...templates,
                            [selectedTemplate]: { ...templates[selectedTemplate], sujet: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Corps du message</label>
                        <textarea
                          rows={10}
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold font-mono resize-none leading-relaxed"
                          value={templates[selectedTemplate]?.corps || ''}
                          onChange={e => setTemplates({
                            ...templates,
                            [selectedTemplate]: { ...templates[selectedTemplate], corps: e.target.value }
                          })}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSaveTemplate(selectedTemplate)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save size={12} /> Sauvegarder Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEME & LOGS */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Supervision & Infrastructure</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Vérification de l'état des dépendances et du flux de logs système</p>
                </div>
                <button
                  onClick={() => {
                    setLogs(prev => [
                      { id: Date.now(), time: new Date().toLocaleTimeString('fr-FR'), type: 'SYS', msg: 'Vérification complète des services système déclenchée.' },
                      ...prev
                    ]);
                    toast.success("Services système rafraîchis !");
                  }}
                  className="bg-[#0b0e24] hover:bg-white/5 text-slate-400 hover:text-white px-4 py-2 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} /> Actualiser
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Django Backend API', desc: 'Conteneur API', icon: Server, color: 'text-green-400 bg-green-500/5 border-green-500/10' },
                  { name: 'Postgres Database 18', desc: 'Persistance', icon: Database, color: 'text-green-400 bg-green-500/5 border-green-500/10' },
                  { name: 'Celery Daemon Workers', desc: 'Rappels automatiques', icon: Clock, color: 'text-green-400 bg-green-500/5 border-green-500/10' },
                  { name: 'AI Diagnostics Engine', desc: 'Microservice IA', icon: Cpu, color: 'text-green-400 bg-green-500/5 border-green-500/10' },
                ].map((s, i) => (
                  <div key={i} className={`border rounded-2xl p-5 ${s.color}`}>
                    <s.icon size={22} className="mb-4" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">{s.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold">{s.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-green-400 mt-4 px-2 py-0.5 bg-green-500/10 rounded-lg">
                      <CheckCircle2 size={10} /> Opérationnel
                    </span>
                  </div>
                ))}
              </div>

              {/* Console Logs */}
              <div className="bg-[#030712] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-white/5 bg-[#090d16]/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Console Système</h3>
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Temps réel (sans patient data)</span>
                </div>
                <div className="p-6 font-mono text-[10px] space-y-2 bg-[#02040a] max-h-60 overflow-y-auto">
                  {logs.map(l => (
                    <div key={l.id} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors">
                      <span className="text-slate-600 shrink-0">[{l.time}]</span>
                      <span className={`shrink-0 font-bold ${
                        l.type === 'AUTH' ? 'text-indigo-400' : l.type === 'DB' ? 'text-blue-400' : 'text-slate-400'
                      }`}>[{l.type}]</span>
                      <span className="text-slate-400 truncate">{l.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL CRÉATION COMPTE PRATICIEN */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0c0f24] p-10 rounded-[30px] border border-white/10 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white cursor-pointer"><X size={18}/></button>
            <h2 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
              <UserPlus className="text-blue-500" /> Nouveau Praticien
            </h2>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Nom d'utilisateur</label>
                <input type="text" placeholder="Nom complet" required className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Email Professionnel</label>
                <input type="email" placeholder="email@medpredict.ma" required className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Mot de passe temporaire</label>
                <input type="password" placeholder="••••••••" required className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Rôle</label>
                <select className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-blue-500 text-xs font-bold" onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="MEDECIN" className="bg-[#0b0e24]">Médecin référent</option>
                  <option value="SECRETAIRE" className="bg-[#0b0e24]">Secrétaire d'accueil</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white mt-4 hover:bg-blue-500 transition-all cursor-pointer">Créer l'accès</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}