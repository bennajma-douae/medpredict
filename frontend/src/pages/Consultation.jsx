import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope, Clipboard, BrainCircuit, Save, ArrowLeft,
  User, Video, Phone, Droplets, AlertTriangle, Calendar,
  CreditCard, Clock, CheckCircle, Loader2
} from 'lucide-react';
import axios from 'axios';

// ── Utilitaire ──
const calcAge = (dateNaissance) => {
  if (!dateNaissance) return null;
  const today = new Date();
  const born  = new Date(dateNaissance);
  let age = today.getFullYear() - born.getFullYear();
  const m = today.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
  return age;
};

// ── Composant champ dossier ──
const DossierField = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-b-0 group">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={13} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-sm font-black ${accent || 'text-white'} text-right max-w-[55%]`}>
      {value || <span className="text-slate-600 font-medium text-xs italic">Non renseigné</span>}
    </span>
  </div>
);

// ── Badge type consultation ──
const TypeBadge = ({ type }) => {
  const isVisio = type === 'VISIO';
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-widest ${
      isVisio
        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
        : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300'
    }`}>
      {isVisio ? <Video size={14} /> : <User size={14} />}
      {isVisio ? 'Consultation à distance' : 'Consultation présentiel'}
    </div>
  );
};

// ════════════════════════════════════════
const Consultation = () => {
  const { rdvId } = useParams();
  const navigate  = useNavigate();

  const [rdv, setRdv]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [symptomes, setSymptomes] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [startTime]               = useState(new Date());
  const [elapsed, setElapsed]     = useState(0);

  // Chronomètre de consultation
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Chargement du RDV + dossier patient
  useEffect(() => {
    const fetchRdvData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/api/appointments/${rdvId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRdv(res.data);
      } catch (err) {
        console.error('Erreur chargement RDV :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRdvData();
  }, [rdvId]);

  // Sauvegarde de la consultation
  const handleSave = async () => {
    if (!symptomes.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/consultations/', {
        rendezvous: rdvId,
        symptomes,
        diagnostic,
        notes,
        pathologies_probables: null,   // réservé au microservice IA
        score_confiance: null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Erreur sauvegarde :', err);
      setSaving(false);
    }
  };

  // ── États de chargement ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 size={24} className="animate-spin mr-3" />
        <span className="font-bold text-sm uppercase tracking-widest">Chargement du dossier…</span>
      </div>
    );
  }

  if (!rdv) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <AlertTriangle size={24} className="mr-3" />
        <span className="font-bold text-sm">Rendez-vous introuvable.</span>
      </div>
    );
  }

  const age      = calcAge(rdv.patient_date_naissance);
  const nomComplet = rdv.patient_nom_complet || rdv.patient_nom || 'Patient';
  const isVisio  = rdv.type === 'VISIO';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">

      {/* ── BARRE DE SESSION ── */}
      <div className={`flex justify-between items-center p-5 rounded-[28px] shadow-2xl ${
        isVisio
          ? 'bg-gradient-to-r from-indigo-700 to-indigo-600 shadow-indigo-900/30'
          : 'bg-gradient-to-r from-blue-700 to-blue-600 shadow-blue-900/30'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
                Consultation en cours
              </h2>
              <TypeBadge type={rdv.type} />
            </div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              RDV #{rdv.id} — Motif : {rdv.motif}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right text-white">
          <div>
            <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Démarré à</p>
            <p className="text-lg font-black tabular-nums">
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl border ${
            isVisio ? 'bg-indigo-500/30 border-indigo-400/30' : 'bg-blue-500/30 border-blue-400/30'
          }`}>
            <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Durée</p>
            <p className="text-lg font-black tabular-nums">{formatElapsed(elapsed)}</p>
          </div>
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* ══ COLONNE GAUCHE : DOSSIER MÉDICAL ══ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Identité patient */}
          <div className="glass rounded-[32px] border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400">
                <Stethoscope size={18} />
              </div>
              <div>
                <p className="text-white font-black text-lg tracking-tight leading-none">
                  {nomComplet}
                </p>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  Dossier patient
                </p>
              </div>
            </div>

            <div className="p-5 space-y-0">
              <DossierField
                icon={CreditCard}
                label="CIN"
                value={rdv.patient_cin}
                accent="text-white"
              />
              <DossierField
                icon={Calendar}
                label="Âge"
                value={age !== null ? `${age} ans` : null}
                accent="text-white"
              />
              <DossierField
                icon={User}
                label="Genre"
                value={rdv.patient_genre === 'M' ? 'Masculin' : rdv.patient_genre === 'F' ? 'Féminin' : null}
                accent="text-white"
              />
              <DossierField
                icon={Phone}
                label="Téléphone"
                value={rdv.patient_telephone}
                accent="text-slate-300"
              />
            </div>
          </div>

          {/* Informations médicales */}
          <div className="glass rounded-[32px] border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Données médicales
              </p>
            </div>
            <div className="p-5 space-y-0">
              <DossierField
                icon={Droplets}
                label="Groupe Sanguin"
                value={rdv.patient_groupe_sanguin}
                accent="text-red-400"
              />
              <div className="py-3">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <AlertTriangle size={13} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Allergies</span>
                </div>
                {rdv.patient_allergies ? (
                  <p className="text-sm text-amber-400 font-bold bg-amber-600/10 border border-amber-500/20 rounded-xl p-3 leading-relaxed">
                    {rdv.patient_allergies}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 italic">Aucune allergie connue</p>
                )}
              </div>
            </div>
          </div>

          {/* Bloc visio — affiché seulement si VISIO */}
          {isVisio && (
            <div className="glass rounded-[32px] border-indigo-500/20 overflow-hidden bg-indigo-600/5">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Video size={16} className="text-indigo-400" />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Session à distance
                  </p>
                </div>
                <p className="text-slate-400 text-xs mb-4">
                  Le patient est connecté à distance. Assurez-vous que la caméra et le micro sont actifs avant de démarrer.
                </p>
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Video size={14} /> Rejoindre la visio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ COLONNE DROITE : EXAMEN ══ */}
        <div className="lg:col-span-3 space-y-4">

          {/* Observation clinique */}
          <div className="glass p-7 rounded-[32px] border-white/5">
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex items-center gap-3">
              <Clipboard size={14} className="text-blue-400" />
              Observation Clinique
            </h3>

            <div className="space-y-4">
              {/* Symptômes */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">
                  Symptômes observés *
                </label>
                <textarea
                  value={symptomes}
                  onChange={e => setSymptomes(e.target.value)}
                  placeholder="Ex : Fièvre à 38.5°C depuis 3 jours, toux sèche, douleurs thoraciques…"
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-sm outline-none focus:border-blue-500 min-h-[130px] resize-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Diagnostic */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">
                  Diagnostic médecin
                </label>
                <textarea
                  value={diagnostic}
                  onChange={e => setDiagnostic(e.target.value)}
                  placeholder="Conclusion diagnostique du médecin…"
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-sm outline-none focus:border-blue-500 min-h-[90px] resize-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 ml-1">
                  Notes complémentaires
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observations, recommandations, suivi…"
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-sm outline-none focus:border-white/20 min-h-[70px] resize-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* ── Placeholder IA ── */}
          <div className="relative overflow-hidden rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-indigo-900/30 via-blue-900/20 to-slate-900/30">
            {/* Décor */}
            <BrainCircuit
              className="absolute -right-6 -bottom-6 text-blue-500/8 pointer-events-none"
              size={180}
            />
            <div className="relative z-10 p-7">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <BrainCircuit size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest">
                    Assistance Diagnostic IA
                  </p>
                  <p className="text-slate-600 text-[9px] uppercase tracking-widest font-bold">
                    Module non connecté
                  </p>
                </div>
                <div className="ml-auto px-3 py-1 bg-amber-600/15 border border-amber-500/20 rounded-xl">
                  <span className="text-amber-400 text-[9px] font-black uppercase tracking-widest">
                    À venir
                  </span>
                </div>
              </div>

              <p className="text-slate-500 text-xs leading-relaxed mb-5">
                Le microservice de prédiction sera connecté ici. Une fois les symptômes saisis,
                le modèle proposera des pathologies probables avec un score de confiance.
              </p>

              {/* Zone de résultat IA — vide intentionnellement */}
              <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-5 text-center">
                <BrainCircuit size={28} className="text-white/10 mx-auto mb-2" />
                <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">
                  Les prédictions s'afficheront ici
                </p>
              </div>
            </div>
          </div>

          {/* ── Bouton sauvegarder ── */}
          <button
            onClick={handleSave}
            disabled={!symptomes.trim() || saving || saved}
            className={`w-full py-5 rounded-[24px] font-black uppercase text-sm tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-300 ${
              saved
                ? 'bg-emerald-600 text-white cursor-default'
                : !symptomes.trim()
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  : saving
                    ? 'bg-blue-700 text-white cursor-wait'
                    : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-lg hover:shadow-blue-900/40'
            }`}
          >
            {saved ? (
              <><CheckCircle size={18} /> Consultation enregistrée — redirection…</>
            ) : saving ? (
              <><Loader2 size={18} className="animate-spin" /> Enregistrement…</>
            ) : (
              <><Save size={18} /> Enregistrer la consultation</>
            )}
          </button>

          {!symptomes.trim() && (
            <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest -mt-2">
              Veuillez saisir au moins les symptômes pour enregistrer
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consultation;
