import React, { useState, useRef, useEffect } from 'react';
import {
  User, Lock, Bell, Save, CheckCircle2, Eye, EyeOff, Upload,
  Phone, Mail, Calendar, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const SectionCard = ({ icon: Icon, title, color = 'indigo', children }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}><Icon size={16} /></div>
        <h2 className="font-black text-sm text-slate-700">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />}
    <input
      {...props}
      className={`w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 
        outline-none focus:border-indigo-400 focus:bg-white transition-all
        ${Icon ? 'pl-9 pr-3' : 'px-3'} py-2.5`}
    />
  </div>
);

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 
        outline-none focus:border-indigo-400 focus:bg-white transition-all px-3 py-2.5 appearance-none pr-8 font-bold"
    >
      {children}
    </select>
    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
  </div>
);

const Toggle = ({ checked, onChange, label, sub }) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <p className="text-sm font-bold text-slate-700">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  </div>
);

export default function SecretarySettings() {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ─ Profil ─ */
  const [profil, setProfil] = useState({
    prenom: user?.username || '',
    nom: 'Secrétariat',
    email: user?.email || 'contact@medpredict.ma',
    telephone: '+212 6 12 34 56 78',
    avatarPreview: null,
  });
  const [pwd, setPwd] = useState({ current: '', new1: '', new2: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new1: false, new2: false });
  const fileRef = useRef();

  /* ─ Paramètres de l'Agenda (Gérés par la secrétaire comme demandé) ─ */
  const [rdvConfig, setRdvConfig] = useState({
    duree: '30',
    maxParJour: '20',
    delaiMin: '24',
    typeDefaut: 'CABINET',
  });

  /* ─ Preferences de notifications ─ */
  const [notifs, setNotifs] = useState({
    alerteDemande: true,
    alerteAnnulation: true,
    sonNotification: true,
    emailQuotidien: false,
  });

  const fetchCabinet = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/config/cabinet/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setRdvConfig({
          duree: res.data.duree_rdv || '30',
          maxParJour: res.data.max_rdv_par_jour || '20',
          delaiMin: res.data.delai_min_heures || '24',
          typeDefaut: res.data.type_defaut || 'CABINET'
        });
      }
    } catch (err) {
      console.error("Erreur de chargement de la configuration de l'agenda :", err);
    }
  };

  useEffect(() => {
    fetchCabinet();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfil(p => ({ ...p, avatarPreview: URL.createObjectURL(file) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/config/cabinet/`, {
        duree_rdv: rdvConfig.duree,
        max_rdv_par_jour: rdvConfig.maxParJour,
        delai_min_heures: rdvConfig.delaiMin,
        type_defaut: rdvConfig.typeDefaut
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Stocker aussi localement en fallback pour le frontend immédiat
      localStorage.setItem('mp_rdv_config', JSON.stringify(rdvConfig));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Paramètres du Secrétariat</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">Gerez vos informations, vos alertes et la planification des consultations</p>
      </div>

      {/* 👤 1. PROFIL */}
      <SectionCard icon={User} title="Mon Profil & Sécurité" color="indigo">
        <div className="flex items-center gap-5 pb-4 border-b border-slate-100">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 overflow-hidden flex items-center justify-center">
              {profil.avatarPreview ? (
                <img src={profil.avatarPreview} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <span className="text-2xl font-black text-indigo-500">
                  {profil.prenom.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all"
            >
              +
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-black text-sm text-slate-700">Photo de profil</p>
            <p className="text-[11px] text-slate-400">Cliquez sur le bouton pour changer votre avatar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Prénom"><Input icon={User} value={profil.prenom} onChange={e => setProfil({ ...profil, prenom: e.target.value })} /></Field>
          <Field label="Nom"><Input value={profil.nom} onChange={e => setProfil({ ...profil, nom: e.target.value })} /></Field>
          <Field label="Email"><Input icon={Mail} type="email" value={profil.email} onChange={e => setProfil({ ...profil, email: e.target.value })} /></Field>
          <Field label="Téléphone"><Input icon={Phone} value={profil.telephone} onChange={e => setProfil({ ...profil, telephone: e.target.value })} /></Field>
        </div>

        {/* Mot de passe */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={13} className="text-slate-400" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Changer le mot de passe</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'current', label: 'Mot de passe actuel' },
              { key: 'new1', label: 'Nouveau' },
              { key: 'new2', label: 'Confirmer' },
            ].map(({ key, label }) => (
              <Field key={key} label={label}>
                <div className="relative">
                  <Input icon={Lock} type={showPwd[key] ? 'text' : 'password'} placeholder="••••••••"
                    value={pwd[key]} onChange={e => setPwd({ ...pwd, [key]: e.target.value })} />
                  <button type="button" onClick={() => setShowPwd({ ...showPwd, [key]: !showPwd[key] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showPwd[key] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </Field>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 📅 2. PARAMÈTRES DE L'AGENDA (Gérés par la secrétaire) */}
      <SectionCard icon={Calendar} title="Planification & Agenda" color="violet">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Durée de consultation par défaut">
            <Select value={rdvConfig.duree} onChange={e => setRdvConfig({ ...rdvConfig, duree: e.target.value })}>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </Select>
          </Field>
          <Field label="Nombre maximum de RDV par jour">
            <Input type="number" min="1" max="100" value={rdvConfig.maxParJour} onChange={e => setRdvConfig({ ...rdvConfig, maxParJour: e.target.value })} />
          </Field>
          <Field label="Délai minimum pour réserver à l'avance (heures)">
            <Select value={rdvConfig.delaiMin} onChange={e => setRdvConfig({ ...rdvConfig, delaiMin: e.target.value })}>
              <option value="1">1 heure à l'avance</option>
              <option value="4">4 heures à l'avance</option>
              <option value="12">12 heures à l'avance</option>
              <option value="24">24 heures à l'avance (1 jour)</option>
              <option value="48">48 heures à l'avance (2 jours)</option>
            </Select>
          </Field>
          <Field label="Type de consultation par défaut">
            <Select value={rdvConfig.typeDefaut} onChange={e => setRdvConfig({ ...rdvConfig, typeDefaut: e.target.value })}>
              <option value="CABINET">Présentiel au Cabinet</option>
              <option value="VISIO">Téléconsultation en Visioconférence</option>
            </Select>
          </Field>
        </div>
      </SectionCard>

      {/* 🔔 3. NOTIFICATIONS & ALERTES */}
      <SectionCard icon={Bell} title="Mes Préférences d'Alertes" color="amber">
        <div className="space-y-4">
          <Toggle
            checked={notifs.alerteDemande}
            onChange={v => setNotifs({ ...notifs, alerteDemande: v })}
            label="Alerte pour chaque nouvelle demande"
            sub="Afficher un badge visuel en temps réel en cas de nouvelle demande de RDV"
          />
          <Toggle
            checked={notifs.alerteAnnulation}
            onChange={v => setNotifs({ ...notifs, alerteAnnulation: v })}
            label="Notifier lors d'une annulation par un patient"
            sub="Afficher un toast de notification si un patient annule son créneau"
          />
          <Toggle
            checked={notifs.sonNotification}
            onChange={v => setNotifs({ ...notifs, sonNotification: v })}
            label="Activer les alertes sonores"
            sub="Émettre un son discret à la réception d'un nouveau message de téléconsultation"
          />
          <Toggle
            checked={notifs.emailQuotidien}
            onChange={v => setNotifs({ ...notifs, emailQuotidien: v })}
            label="Recevoir le récapitulatif par email"
            sub="M'envoyer le planning de demain chaque soir par email"
          />
        </div>
      </SectionCard>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end z-40 shadow-lg md:left-72">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all ${
            saved ? 'bg-emerald-500' : saving ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {saved ? <><CheckCircle2 size={14} /> Enregistré !</> : saving ? 'Enregistrement…' : <><Save size={14} /> Enregistrer les changements</>}
        </button>
      </div>
    </div>
  );
}
