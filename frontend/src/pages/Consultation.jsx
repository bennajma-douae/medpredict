import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Stethoscope, Clipboard, BrainCircuit, Save, ArrowLeft,
  User, Video, Phone, Droplets, AlertTriangle, Calendar,
  CreditCard, Clock, CheckCircle, Loader2, ExternalLink
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
  <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-b-0 group">
    <div className="flex items-center gap-3 text-slate-400">
      <Icon size={14} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-sm font-bold ${accent || 'text-slate-700'} text-right max-w-[60%]`}>
      {value || <span className="text-slate-300 font-medium italic">Non renseigné</span>}
    </span>
  </div>
);

// ── Badge type consultation ──
const TypeBadge = ({ type }) => {
  const isVisio = type === 'VISIO';
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-widest ${
      isVisio
        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
        : 'bg-emerald-50 border-emerald-200 text-emerald-600'
    }`}>
      {isVisio ? <Video size={14} /> : <User size={14} />}
      {isVisio ? 'Consultation à distance' : 'Consultation présentiel'}
    </div>
  );
};

// ════════════════════════════════════════
const Consultation = () => {
  const { rdvId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ AJOUT : Déterminer le rôle (médecin ou patient) depuis l'URL ou le store
  const [userRole, setUserRole] = useState('doctor'); // 'doctor' ou 'patient'
  
  // LOGIQUE ORIGINALE
  const [rdv, setRdv]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [symptomes, setSymptomes] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [startTime]               = useState(new Date());
  const [elapsed, setElapsed]     = useState(0);
  const [isFromTeleconsult, setIsFromTeleconsult] = useState(false);

  // ✅ AJOUT : Vérifier le rôle de l'utilisateur connecté
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (user.role === 'PATIENT') {
          setUserRole('patient');
        } else if (user.role === 'MEDECIN') {
          setUserRole('doctor');
        } else {
          // Vérifier aussi depuis l'URL (si on vient de la téléconsultation)
          const params = new URLSearchParams(location.search);
          if (params.get('role') === 'patient') {
            setUserRole('patient');
          } else if (params.get('role') === 'doctor') {
            setUserRole('doctor');
          }
        }
      } catch (err) {
        console.error("Erreur récupération rôle:", err);
      }
    };
    checkUserRole();
  }, [location]);

  // ✅ AJOUT : Vérifier les paramètres d'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('from') === 'teleconsult' || params.get('prescription') === 'true') {
      setIsFromTeleconsult(true);
      setTimeout(() => {
        alert("✅ Retour de la téléconsultation. Vous pouvez maintenant finaliser le dossier médical.");
      }, 500);
    }
  }, [location]);

  // ✅ AJOUT : Écouter les messages de l'iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'http://localhost:5000') return;
      
      if (event.data && event.data.type === 'END_CONSULTATION') {
        alert("Consultation terminée. Retour au tableau de bord...");
        navigate('/dashboard');
      }
      
      if (event.data && event.data.type === 'TRANSCRIPTION_READY') {
        const transcription = event.data.text;
        if (transcription && confirm("Une transcription est disponible. Voulez-vous l'ajouter aux symptômes ?")) {
          setSymptomes(prev => prev + (prev ? '\n' : '') + transcription);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  // Chronomètre
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

  // Chargement
  useEffect(() => {
    const fetchRdvData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/api/appointments/${rdvId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRdv(res.data);
        
        if (res.data.type === 'VISIO' && !isFromTeleconsult) {
          console.log("Consultation visio détectée");
        }
      } catch (err) {
        console.error('Erreur chargement RDV :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRdvData();
  }, [rdvId, isFromTeleconsult]);

  // ✅ AJOUT : Fonction pour ouvrir la téléconsultation (avec rôle)
  const openTeleconsultation = () => {
    const patientName = encodeURIComponent(rdv.patient_nom_complet || rdv.patient_nom || 'Patient');
    const doctorName = encodeURIComponent('Dr. ' + (rdv.medecin_nom || 'Médecin'));
    // Passer le rôle dans l'URL
    const teleconsultUrl = `http://localhost:5000/consultation?room=${rdvId}&role=${userRole}&patient=${patientName}&doctor=${doctorName}&rdvId=${rdvId}`;
    window.open(teleconsultUrl, '_blank');
  };

  // Sauvegarde (inchangée)
  const handleSave = async () => {
    if (!symptomes.trim()) {
      alert("Veuillez saisir au moins les symptômes.");
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const dataToSend = {
        rendezvous: parseInt(rdvId),
        symptomes: symptomes,
        diagnostic: diagnostic || "Non spécifié",
        notes: notes || ""
      };

      const res = await axios.post('http://localhost:8000/api/consultations/', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaved(true);
      
      await axios.patch(`http://localhost:8000/api/appointments/${rdvId}/`, 
        { statut: 'TERMINE' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (err) {
      console.error('Erreur:', err.response?.data);
      const message = err.response?.data 
        ? JSON.stringify(err.response.data) 
        : "Le serveur ne répond pas";
      alert("Erreur lors de l'enregistrement : " + message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-blue-600">
        <Loader2 size={32} className="animate-spin mr-3" />
        <span className="font-bold text-sm uppercase tracking-widest">Chargement du dossier…</span>
      </div>
    );
  }

  if (!rdv) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertTriangle size={24} className="mr-3" />
        <span className="font-bold text-sm">Rendez-vous introuvable.</span>
      </div>
    );
  }

  const age = calcAge(rdv.patient_date_naissance);
  const nomComplet = rdv.patient_nom_complet || rdv.patient_nom || 'Patient';
  const isVisio = rdv.type === 'VISIO';
  
  // ✅ AJOUT : Vérifier si l'utilisateur est le patient (désactiver certaines fonctionnalités)
  const isPatient = userRole === 'patient';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 font-sans">

      {/* ── BARRE DE SESSION ── */}
      <div className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(isPatient ? '/patient-dashboard' : '/dashboard')}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">
                {isPatient ? 'Ma Consultation' : 'Consultation en cours'}
              </h2>
              <TypeBadge type={rdv.type} />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              RDV #{rdv.id} — Motif : {rdv.motif}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right border-r border-slate-100 pr-8">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Démarré à</p>
            <p className="text-xl font-black text-slate-700 tabular-nums">
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-100">
            <p className="text-[10px] font-black uppercase opacity-60 mb-1">Durée</p>
            <p className="text-xl font-black tabular-nums">{formatElapsed(elapsed)}</p>
          </div>
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="grid lg:grid-cols-5 gap-8">

        {/* ══ COLONNE GAUCHE : DOSSIER MÉDICAL ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Identité patient */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <User size={28} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 tracking-tight">
                  {isPatient ? 'Mon dossier' : nomComplet}
                </p>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">
                  {isPatient ? 'Mes informations' : 'Dossier patient actif'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <DossierField icon={CreditCard} label="CIN" value={rdv.patient_cin} />
              <DossierField icon={Calendar} label="Âge" value={age !== null ? `${age} ans` : null} />
              <DossierField icon={User} label="Genre" value={rdv.patient_genre === 'M' ? 'Masculin' : rdv.patient_genre === 'F' ? 'Féminin' : null} />
              <DossierField icon={Phone} label="Téléphone" value={rdv.patient_telephone} accent="text-blue-600" />
            </div>
          </div>

          {/* Informations médicales */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Données médicales</h4>
            <div className="space-y-1">
              <DossierField icon={Droplets} label="Groupe Sanguin" value={rdv.patient_groupe_sanguin} accent="text-red-500" />
              <div className="py-4">
                <div className="flex items-center gap-3 text-slate-400 mb-3">
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Allergies signalées</span>
                </div>
                {rdv.patient_allergies ? (
                  <p className="text-sm text-amber-700 font-bold bg-amber-50 border border-amber-100 rounded-2xl p-4 leading-relaxed">
                    {rdv.patient_allergies}
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 font-medium italic">Aucune allergie connue</p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ MODIFICATION : Bloc visio - adapté selon le rôle */}
          {isVisio && (
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <Video size={20} className="text-white/80" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Session à distance</p>
              </div>
              
              {isPatient ? (
                // Vue PATIENT
                <>
                  <p className="text-indigo-100 text-xs mb-5 font-medium leading-relaxed">
                    Votre téléconsultation va commencer. Cliquez ci-dessous pour rejoindre le Dr. {rdv.medecin_nom || 'Médecin'}.
                  </p>
                  <button 
                    onClick={openTeleconsultation}
                    className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={14} />
                    Rejoindre la téléconsultation
                  </button>
                </>
              ) : (
                // Vue MEDECIN
                <>
                  <p className="text-indigo-100 text-xs mb-5 font-medium leading-relaxed">
                    Le patient est prêt pour la vidéoconsultation. Cliquez ci-dessous pour lancer la session sécurisée.
                  </p>
                  <button 
                    onClick={openTeleconsultation}
                    className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={14} />
                    Lancer la téléconsultation
                  </button>
                </>
              )}
              
              {isFromTeleconsult && (
                <p className="text-indigo-200 text-[8px] text-center mt-3">
                  ✓ Retour de téléconsultation détecté
                </p>
              )}
            </div>
          )}
        </div>

        {/* ══ COLONNE DROITE : EXAMEN ── */}
        {/* ✅ MODIFICATION : Cacher certains champs pour le patient */}
        <div className="lg:col-span-3 space-y-6">

          {/* Observation clinique - visible uniquement pour le médecin */}
          {!isPatient && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
              <h3 className="text-slate-800 font-black uppercase text-xs tracking-[0.3em] mb-10 flex items-center gap-4">
                <Clipboard size={18} className="text-blue-500" />
                Observation Clinique
              </h3>

              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">
                    Symptômes observés *
                  </label>
                  <textarea
                    value={symptomes}
                    onChange={e => setSymptomes(e.target.value)}
                    placeholder="Ex : Fièvre à 38.5°C, toux sèche..."
                    className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[30px] text-slate-800 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[140px] resize-none shadow-inner placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">
                    Diagnostic médical
                  </label>
                  <textarea
                    value={diagnostic}
                    onChange={e => setDiagnostic(e.target.value)}
                    placeholder="Conclusion diagnostique..."
                    className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[30px] text-slate-800 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[100px] resize-none shadow-inner placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">
                    Notes de suivi
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observations complémentaires..."
                    className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[30px] text-slate-800 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[80px] resize-none shadow-inner placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ✅ AJOUT : Vue patient - informations de la consultation */}
          {isPatient && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
              <h3 className="text-slate-800 font-black uppercase text-xs tracking-[0.3em] mb-6 flex items-center gap-4">
                <Clipboard size={18} className="text-teal-500" />
                Récapitulatif de la consultation
              </h3>
              
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Motif</p>
                  <p className="text-slate-800 font-medium">{rdv.motif}</p>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date et heure</p>
                  <p className="text-slate-800 font-medium">{rdv.date} à {rdv.heure?.slice(0,5)}</p>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Médecin</p>
                  <p className="text-slate-800 font-medium">Dr. {rdv.medecin_nom || rdv.medecin?.username || 'Médecin'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Assistance IA - pour médecin uniquement */}
          {!isPatient && (
            <div className="relative overflow-hidden rounded-[40px] border border-blue-100 bg-blue-50/50 p-10">
              <BrainCircuit className="absolute -right-10 -bottom-10 text-blue-500/5" size={250} />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest">Moteur de prédiction IA</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Module en attente</p>
                  </div>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed max-w-md">
                  Les prédictions de pathologies s'afficheront ici après analyse automatique des symptômes saisis plus haut.
                </p>
              </div>
            </div>
          )}

          {/* Bouton sauvegarder - pour médecin uniquement */}
          {!isPatient && (
            <div className="space-y-4 pt-4">
              <button
                onClick={handleSave}
                disabled={!symptomes.trim() || saving || saved}
                className={`w-full py-6 rounded-[30px] font-black uppercase text-sm tracking-widest shadow-xl flex items-center justify-center gap-4 transition-all duration-300 ${
                  saved
                    ? 'bg-emerald-600 text-white cursor-default'
                    : !symptomes.trim()
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200 shadow-none'
                      : saving
                        ? 'bg-blue-700 text-white cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-blue-100'
                }`}
              >
                {saved ? (
                  <><CheckCircle size={20} /> Consultation enregistrée</>
                ) : saving ? (
                  <><Loader2 size={20} className="animate-spin" /> Finalisation...</>
                ) : (
                  <><Save size={20} /> Enregistrer la consultation</>
                )}
              </button>
              {!symptomes.trim() && (
                <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Symptômes requis pour l'enregistrement
                </p>
              )}
            </div>
          )}

          {/* ✅ AJOUT : Message pour le patient après consultation */}
          {isPatient && saved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <CheckCircle size={24} className="text-emerald-600 mx-auto mb-2" />
              <p className="text-emerald-700 font-bold text-sm">Consultation terminée</p>
              <p className="text-emerald-600 text-xs mt-1">Votre dossier médical a été mis à jour</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consultation;