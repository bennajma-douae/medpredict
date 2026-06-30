import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Stethoscope, Clipboard, BrainCircuit, Save, ArrowLeft,
  User, Video, Phone, Droplets, AlertTriangle, Calendar,
  CreditCard, Clock, CheckCircle, Loader2, ExternalLink,
  Sparkles, Activity, RefreshCw, X, Plus, Trash2, Search,
  Pill, FileText, Info, AlertCircle, Eye, Download, ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import { toast, confirmAlert } from '../store/uiStore';

// ── DESIGN TOKENS (For custom styling overrides if needed) ──
const T = {
  bg:      "#F0F4FA",
  panel:   "#ffffff",
  accent:  "#2563eb",
  purple:  "#7c3aed",
  emerald: "#059669",
  amber:   "#d97706",
  rose:    "#e11d48",
};

// ── DRUG DATABASE FOR PHARMACY ──
const DRUG_DB = [
  { name: "Amoxicilline", class: "Antibiotique", defaultDose: "500mg", defaultFreq: "3×/j", defaultDur: "7j", route: "PO" },
  { name: "Paracétamol", class: "Antalgique", defaultDose: "1g", defaultFreq: "4×/j", defaultDur: "5j", route: "PO" },
  { name: "Ibuprofène", class: "AINS", defaultDose: "400mg", defaultFreq: "3×/j", defaultDur: "5j", route: "PO" },
  { name: "Oméprazole", class: "IPP", defaultDose: "20mg", defaultFreq: "1×/j", defaultDur: "14j", route: "PO" },
  { name: "Metformine", class: "Antidiabétique", defaultDose: "500mg", defaultFreq: "2×/j", defaultDur: "30j", route: "PO" },
  { name: "Salbutamol", class: "Bronchodilatateur", defaultDose: "2 bouffées", defaultFreq: "4×/j", defaultDur: "7j", route: "Inh." },
  { name: "Prednisolone", class: "Corticoïde", defaultDose: "20mg", defaultFreq: "1×/j", defaultDur: "5j", route: "PO" },
  { name: "Azithromycine", class: "Antibiotique", defaultDose: "500mg", defaultFreq: "1×/j", defaultDur: "3j", route: "PO" },
];

const ROUTES = ["PO", "IV", "IM", "SC", "Top.", "Inh.", "SL", "PR"];

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
      {isVisio ? 'Consultation à distance' : 'Consultation présentielle'}
    </div>
  );
};

// ── Confidence Badge ──
const ConfidenceBadge = ({ pct }) => {
  const val = parseFloat(pct);
  const colorClass = val >= 60 
    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
    : val >= 30 
      ? 'bg-amber-50 border-amber-200 text-amber-600' 
      : 'bg-rose-50 border-rose-200 text-rose-600';
  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider shadow-sm ${colorClass}`}>
      {pct}
    </span>
  );
};

// ── Explanation Panel for IA predictions ──
const ExplanationPanel = ({ expl }) => {
  const [open, setOpen] = useState(false);
  if (!expl) return null;
  return (
    <div className="mt-3">
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} 
        className="flex items-center gap-1.5 text-slate-400 hover:text-purple-600 text-[9px] font-black uppercase tracking-wider transition-colors"
      >
        <Sparkles size={11} className="text-purple-500" /> 
        Explication IA 
        <span className="opacity-50">•</span>
        {open ? 'Masquer' : 'Afficher'}
      </button>
      {open && (
        <div className="mt-3 pl-3 border-l-2 border-purple-200 text-[11px] text-slate-500 space-y-1.5 leading-relaxed bg-purple-50/20 p-2.5 rounded-r-xl">
          {expl.key_symptoms?.length > 0 && (
            <div>
              <span className="text-slate-700 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Symptômes clés :</span> 
              <span className="text-slate-600 bg-white border border-slate-100 rounded px-1.5 py-0.5 inline-block mt-0.5">
                {expl.key_symptoms.join(", ").replace(/_/g, " ")}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-slate-700 font-bold uppercase text-[9px] tracking-wider block">Influence Sexe :</span> 
              <span className="text-slate-600">{expl.sex_influence || "Négligeable"}</span>
            </div>
            <div>
              <span className="text-slate-700 font-bold uppercase text-[9px] tracking-wider block">Influence Antécédents :</span> 
              <span className="text-slate-600">{expl.history_influence || "Négligeable"}</span>
            </div>
          </div>
          {expl.score_delta_pct && (
            <div className="font-semibold text-purple-600/80 mt-1 flex items-center gap-1">
              <Activity size={10} /> {expl.score_delta_pct}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
const Consultation = () => {
  const { rdvId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState('doctor'); // 'doctor' ou 'patient'
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

  // ── IA & SYMPTOMS SEARCH ──
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [symptomTags, setSymptomTags] = useState([]);
  const [searchSymptomQuery, setSearchSymptomQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // ── PHARMACY & DRUGS ──
  const [medications, setMedications] = useState([]);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [drugClassFilter, setDrugClassFilter] = useState('');
  const [showDrugDatabase, setShowDrugDatabase] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  const [pdfReportUrl, setPdfReportUrl] = useState('');
  const [pdfOrdonnanceUrl, setPdfOrdonnanceUrl] = useState('');
  const [cabinet, setCabinet] = useState(null);

  // ── VIEW STEPS (Doctor Wizard) ──
  // 1 = Anamnèse & Observation, 2 = Analyse IA & Diagnostic, 3 = Pharmacie & Prescription
  const [step, setStep] = useState(1);

  // 1. Déterminer le rôle
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

  // 2. Vérifier si retour visio
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('from') === 'teleconsult' || params.get('prescription') === 'true') {
      setIsFromTeleconsult(true);
      setTimeout(() => {
        toast.info("Retour de la téléconsultation. Vous pouvez finaliser le dossier médical et l'ordonnance.");
      }, 500);
    }
  }, [location]);

  // 3. Écouter messages iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'http://localhost:5000') return;
      
      if (event.data && event.data.type === 'END_CONSULTATION') {
        toast.success("Consultation terminée. Retour au tableau de bord...");
        navigate('/dashboard');
      }
      
      if (event.data && event.data.type === 'TRANSCRIPTION_READY') {
        const transcription = event.data.text;
        if (transcription) {
          confirmAlert("Une transcription audio est disponible. Voulez-vous l'ajouter aux symptômes ?", "Transcription").then((accepted) => {
            if (accepted) {
              setSymptomes(prev => prev + (prev ? '\n' : '') + transcription);
            }
          });
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  // 4. Chronomètre
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startTime]);

  // 5. Charger RDV
  useEffect(() => {
    const fetchRdvData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/api/appointments/${rdvId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRdv(res.data);
        
        // Si le patient a déjà des antécédents, on peut les mettre en historique IA
        if (res.data.patient_allergies) {
          // prefill
        }
      } catch (err) {
        console.error('Erreur chargement RDV :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRdvData();
  }, [rdvId]);

  // 5.b Charger configuration cabinet
  useEffect(() => {
    const fetchCabinetData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/config/cabinet/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCabinet(res.data);
      } catch (err) {
        console.error('Erreur chargement configuration cabinet :', err);
      }
    };
    fetchCabinetData();
  }, []);

  // 6. Recherche de symptômes IA
  useEffect(() => {
    const searchSymptoms = async () => {
      if (!searchSymptomQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5001/symptoms/search?q=${encodeURIComponent(searchSymptomQuery)}`);
        if (res.data && res.data.success) {
          setSearchResults(res.data.results || []);
        }
      } catch (e) {
        console.error("Erreur recherche symptôme IA:", e);
      }
    };

    const timer = setTimeout(searchSymptoms, 250);
    return () => clearTimeout(timer);
  }, [searchSymptomQuery]);

  const handleAddSymptomTag = (tag) => {
    const cleanTag = tag.trim();
    if (!cleanTag || symptomTags.includes(cleanTag)) return;
    setSymptomTags([...symptomTags, cleanTag]);
    setSearchSymptomQuery('');
    setShowSearchDropdown(false);
    
    // Synchroniser avec la zone texte
    setSymptomes(prev => prev + (prev ? ', ' : '') + cleanTag);
  };

  const handleRemoveSymptomTag = (indexToRemove) => {
    setSymptomTags(symptomTags.filter((_, idx) => idx !== indexToRemove));
  };

  // 7. Lancer analyse IA
  const analyzeSymptoms = async () => {
    // Collecter les symptômes des deux sources (Tags & Textarea)
    const tagsList = [...symptomTags];
    if (symptomes.trim()) {
      const parsed = symptomes.split(/,|\n/).map(s => s.trim().replace(/_/g, " ")).filter(Boolean);
      parsed.forEach(s => {
        if (!tagsList.includes(s)) tagsList.push(s);
      });
    }

    if (tagsList.length === 0) {
      toast.warning("Veuillez d'abord saisir ou sélectionner des symptômes.");
      return;
    }

    setAiLoading(true);
    setAiResult(null);
    setSelectedDisease(null);

    try {
      const age = calcAge(rdv.patient_date_naissance);
      const payload = {
        symptoms: tagsList,
        sex: rdv.patient_genre === 'M' ? 'M' : rdv.patient_genre === 'F' ? 'F' : null,
        age: age || null,
        medical_history: rdv.patient_allergies ? [rdv.patient_allergies] : [],
        top_n: 3
      };
      
      const res = await axios.post('http://localhost:5001/predict', payload);
      if (res.data && res.data.success) {
        setAiResult(res.data);
        setSelectedDisease(res.data.predictions[0]?.disease || null);
        setDiagnostic(res.data.predictions[0]?.disease || "");
        toast.success("Analyse IA terminée avec succès !");
        
        // Aller automatiquement à l'étape des résultats
        setStep(2);
      } else {
        toast.error("L'IA n'a pas pu générer de prédiction.");
      }
    } catch (err) {
      console.error("Erreur IA:", err);
      const specificError = err.response?.data?.error;
      toast.error(specificError ? `Erreur IA : ${specificError}` : "Erreur de connexion au service IA (localhost:5001).");
    } finally {
      setAiLoading(false);
    }
  };

  // 8. Gérer Pharmacie / Ordonnance
  const addMedication = (drug) => {
    setMedications([...medications, {
      name: drug?.name || "",
      dosage: drug?.defaultDose || "",
      frequency: drug?.defaultFreq || "",
      duration: drug?.defaultDur || "",
      route: drug?.route || "PO",
      notes: ""
    }]);
    if (drug !== null) {
      setShowDrugDatabase(false);
    }
  };

  const addFreeTextMedication = () => {
    setMedications([...medications, {
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      route: "PO",
      notes: ""
    }]);
  };

  const updateMedication = (idx, field, val) => {
    setMedications(medications.map((med, i) => i === idx ? { ...med, [field]: val } : med));
  };

  const removeMedication = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleSavePrescription = () => {
    setPrescriptionSaved(true);
    toast.success("Ordonnance enregistrée localement.");
    setTimeout(() => setPrescriptionSaved(false), 2000);
  };

  // 9. Lancer/Ouvrir la téléconsultation
  const openTeleconsultation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/appointments/${rdvId}/generer-lien-visio/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        window.open(response.data.doctor_link, '_blank');
        toast.success("Lien de téléconsultation envoyé par email. Session démarrée.");
      }
    } catch (error) {
      console.error("Erreur lien visio:", error);
      toast.error("Impossible de démarrer la téléconsultation.");
    }
  };

  // 10. Enregistrer consultation complète (Django + Optionnel IA Finalize PDF)
  const handleSaveAll = async () => {
    if (!symptomes.trim()) {
      toast.warning("Veuillez saisir au moins les symptômes.");
      return;
    }

    setSaving(true);
    let generatedPdfUrl = '';
    let generatedOrdonnanceUrl = '';

    // A. Essayer de générer le rapport PDF Complet (Médecin) et l'Ordonnance Patient via le microservice IA
    try {
      const age = calcAge(rdv.patient_date_naissance);
      const basePayload = {
        patient: {
          name: rdv.patient_nom_complet || rdv.patient_nom || 'Patient',
          age: age || null,
          gender: rdv.patient_genre || null,
          medical_history: rdv.patient_allergies ? [rdv.patient_allergies] : [],
        },
        selected_disease: diagnostic || "Indéterminé",
        symptoms: symptomTags.length > 0 ? symptomTags : symptomes.split(/,|\n/).map(s => s.trim()),
        notes: notes || "Examen clinique normal",
        medications: medications,
        ai_result: aiResult,
        clinic_info: cabinet ? {
          name: cabinet.nom,
          address: cabinet.adresse,
          phone: cabinet.telephone,
          email: cabinet.email
        } : null
      };

      // 1. Rapport Complet Médecin (exclude_ai = false)
      try {
        const resFinalizeDoctor = await axios.post('http://localhost:5001/finalize', {
          ...basePayload,
          exclude_ai: false
        });
        if (resFinalizeDoctor.data && resFinalizeDoctor.data.success) {
          generatedPdfUrl = `http://localhost:5001${resFinalizeDoctor.data.report_url}`;
          setPdfReportUrl(generatedPdfUrl);
        }
      } catch (eDoc) {
        console.warn("Échec génération PDF Médecin :", eDoc.message);
      }

      // 2. Ordonnance Patient (exclude_ai = true)
      try {
        const resFinalizePatient = await axios.post('http://localhost:5001/finalize', {
          ...basePayload,
          exclude_ai: true
        });
        if (resFinalizePatient.data && resFinalizePatient.data.success) {
          generatedOrdonnanceUrl = `http://localhost:5001${resFinalizePatient.data.report_url}`;
          setPdfOrdonnanceUrl(generatedOrdonnanceUrl);
        }
      } catch (ePat) {
        console.warn("Échec génération PDF Ordonnance Patient :", ePat.message);
      }

      if (generatedPdfUrl && generatedOrdonnanceUrl) {
        toast.success("Rapport complet et ordonnance générés !");
      } else if (generatedPdfUrl || generatedOrdonnanceUrl) {
        toast.success("Document clinique PDF généré !");
      }
    } catch (e) {
      console.warn("Échec génération PDF microservice (optionnel) : ", e.message);
    }

    // B. Enregistrer dans la base de données Django
    try {
      const token = localStorage.getItem('token');
      
      const dataToSend = {
        rendezvous: parseInt(rdvId),
        symptomes: symptomes,
        diagnostic: diagnostic || "Non spécifié",
        notes: notes || ""
      };

      // Sauvegarde consultation Django
      await axios.post('http://localhost:8000/api/consultations/', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Mettre à jour le statut du RDV à 'TERMINE' via l'action dédiée qui convertit également le PatientDraft
      await axios.patch(`http://localhost:8000/api/appointments/${rdvId}/terminer/`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaved(true);
      setSaving(false);
      toast.success("Consultation enregistrée avec succès dans le dossier médical !");
      
      // Ouvrir le rapport médecin automatiquement dans un nouvel onglet
      if (generatedPdfUrl) {
        window.open(generatedPdfUrl, '_blank');
      }

    } catch (err) {
      console.error('Erreur Django:', err.response?.data);
      const msg = err.response?.data ? JSON.stringify(err.response.data) : "Serveur injoignable";
      toast.error("Erreur lors de la sauvegarde : " + msg);
      setSaving(false);
    }
  };

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Filtrer les médicaments de la DB
  const filteredDrugs = DRUG_DB.filter(d => 
    (!drugClassFilter || d.class === drugClassFilter) &&
    (!drugSearchQuery || d.name.toLowerCase().includes(drugSearchQuery.toLowerCase()) || d.class.toLowerCase().includes(drugSearchQuery.toLowerCase()))
  );

  const drugClasses = [...new Set(DRUG_DB.map(d => d.class))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-blue-600">
        <Loader2 size={36} className="animate-spin mr-3 text-blue-500" />
        <span className="font-extrabold text-sm uppercase tracking-widest text-slate-500">Chargement de la session clinique…</span>
      </div>
    );
  }

  if (!rdv) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-red-500 p-6 text-center">
        <AlertTriangle size={48} className="mb-4 text-red-500 animate-bounce" />
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">Rendez-vous introuvable</h2>
        <p className="text-slate-400 text-xs mt-2 mb-6">La fiche clinique n'a pas pu être chargée ou le rendez-vous n'existe plus.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase hover:bg-black transition-all">Retour</button>
      </div>
    );
  }

  const age = calcAge(rdv.patient_date_naissance);
  const nomComplet = rdv.patient_nom_complet || rdv.patient_nom || 'Patient';
  const isVisio = rdv.type === 'VISIO';
  const isPatient = userRole === 'patient';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 font-sans pb-16">
      
      {/* ── BARRE DE SESSION HAUTEMENT POLIE ── */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(isPatient ? '/patient-dashboard' : '/dashboard')}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-100"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-2">
                <Stethoscope size={18} className="text-blue-500" />
                {isPatient ? 'Ma Consultation' : 'Espace Consultation'}
              </h2>
              <TypeBadge type={rdv.type} />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              RDV #{rdv.id} — Motif : <span className="text-slate-600 font-extrabold">{rdv.motif}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="text-right border-r border-slate-100 pr-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Heure début</p>
            <p className="text-sm font-black text-slate-700 tabular-nums">
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-md shadow-blue-100 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
            <div>
              <p className="text-[9px] font-black uppercase opacity-70 tracking-widest">Temps écoulé</p>
              <p className="text-sm font-black tabular-nums">{formatElapsed(elapsed)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEPS NAVIGATION (DOCTOR ONLY WIZARD) ── */}
      {!isPatient && (
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-wrap md:flex-nowrap justify-between gap-2 overflow-x-auto">
          {[
            { id: 1, label: "Symptômes & Anamnèse", icon: Clipboard, color: "text-blue-600" },
            { id: 2, label: "IA Clinique & Diagnostic", icon: BrainCircuit, color: "text-purple-600" },
            { id: 3, label: "Pharmacie & Prescription", icon: Pill, color: "text-emerald-600" }
          ].map((s) => {
            const active = step === s.id;
            const completed = step > s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex-1 min-w-[180px] p-3 rounded-xl flex items-center gap-3 transition-all text-xs font-black uppercase tracking-wider border ${
                  active 
                    ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-inner' 
                    : completed 
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' 
                      : 'bg-white border-transparent text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                  active 
                    ? 'bg-slate-800 text-white' 
                    : completed 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {completed ? "✓" : s.id}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── GRID PRINCIPAL ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ══ GAUCHE : DOSSIER PATIENT (Toujours visible et synthétique) ── */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Fiche Identité */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-60"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                <User size={22} />
              </div>
              <div>
                <p className="text-base font-black text-slate-800 tracking-tight leading-tight">
                  {isPatient ? 'Mon Dossier' : nomComplet}
                </p>
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest mt-1">
                  {isPatient ? 'Mes Informations' : 'Dossier Clinique Actif'}
                </p>
              </div>
            </div>

            <div className="space-y-0.5">
              <DossierField icon={CreditCard} label="CIN" value={rdv.patient_cin} />
              <DossierField icon={Calendar} label="Âge" value={age !== null ? `${age} ans` : null} />
              <DossierField icon={User} label="Genre" value={rdv.patient_genre === 'M' ? 'Masculin' : rdv.patient_genre === 'F' ? 'Féminin' : null} />
              <DossierField icon={Phone} label="Téléphone" value={rdv.patient_telephone} accent="text-blue-600" />
            </div>
          </div>

          {/* Fiche Antécédents */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-50">
              <Droplets size={16} className="text-red-500 animate-pulse" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informations Médicales</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Groupe Sanguin</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-lg text-xs font-black text-red-600">
                  {rdv.patient_groupe_sanguin || '--'}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Allergies & Antécédents</span>
                {rdv.patient_allergies ? (
                  <p className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-100 rounded-xl p-3.5 leading-relaxed">
                    {rdv.patient_allergies}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic font-medium bg-slate-50 border border-transparent rounded-xl p-3">
                    Aucune allergie connue à ce jour.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Téléconsultation / Vidéo */}
          {isVisio && (
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Video size={16} className="text-indigo-100" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-100">Visio-Session</p>
                </div>
                <h3 className="text-lg font-black tracking-tight leading-snug">Téléconsultation en ligne</h3>
                <p className="text-indigo-100/80 text-[11px] font-medium leading-relaxed mt-2">
                  {isPatient 
                    ? `Connectez-vous pour rejoindre le Dr. ${rdv.medecin_nom || 'Médecin'}.`
                    : `Lancez la visioconférence. Le patient recevra son accès sécurisé.`}
                </p>
              </div>

              <div className="mt-6">
                <button 
                  onClick={openTeleconsultation}
                  className="w-full bg-white text-indigo-700 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={12} />
                  {isPatient ? 'Rejoindre la visio' : 'Démarrer la visio'}
                </button>
                {isFromTeleconsult && (
                  <div className="text-[9px] text-center font-semibold text-indigo-200 mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck size={10} /> Session vidéo active terminée
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF du rapport si déjà existant */}
          {pdfReportUrl && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-sm text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider">Ordonnance & Rapport</h5>
                  <p className="text-[10px] font-semibold text-emerald-600">Généré avec succès</p>
                </div>
              </div>
              <a 
                href={pdfReportUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2.5 bg-white border border-emerald-100 rounded-xl text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/20 transition-all"
              >
                <Eye size={16} />
              </a>
            </div>
          )}
        </div>

        {/* ══ DROITE : ESPACE DE TRAVAIL CLINIQUE ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ===================== CAS PATIENT ===================== */}
          {isPatient && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="text-slate-800 font-black uppercase text-xs tracking-widest flex items-center gap-3 border-b border-slate-50 pb-4">
                <Clipboard size={18} className="text-blue-500" />
                Récapitulatif de ma Consultation
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Médecin Consultant</p>
                  <p className="text-slate-800 text-sm font-extrabold">Dr. {rdv.medecin_nom || 'Médecin'}</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motif de consultation</p>
                  <p className="text-slate-800 text-sm font-extrabold">{rdv.motif}</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date du rendez-vous</p>
                  <p className="text-slate-800 text-xs font-bold">{rdv.date} à {rdv.heure?.slice(0, 5)}</p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Statut actuel</p>
                  <span className={`px-2.5 py-1 rounded border text-[9px] font-black uppercase tracking-wider inline-block mt-1 ${
                    rdv.statut === 'CONFIRME' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {rdv.statut}
                  </span>
                </div>
              </div>

              {saved ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider">Session finalisée</h4>
                  <p className="text-emerald-600 text-xs font-semibold">Le médecin a clôturé la consultation et mis à jour votre dossier médical.</p>
                </div>
              ) : (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
                  <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 leading-relaxed font-semibold">
                    <p className="font-bold uppercase tracking-wider mb-1 text-[10px]">Consultation en cours</p>
                    Veuillez attendre que le Dr. {rdv.medecin_nom || 'Médecin'} valide et enregistre les informations cliniques à la fin de l'examen. Vos prescriptions et documents seront téléchargeables ici même.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== CAS MÉDECIN ===================== */}
          {!isPatient && (
            saved ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-sm animate-bounce">
                  <ShieldCheck size={36} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Consultation Enregistrée & Clôturée</h3>
                  <p className="text-slate-500 text-xs font-semibold max-w-md mx-auto leading-relaxed">
                    Le dossier médical du patient a été mis à jour avec succès dans le système. Les documents PDF officiels sont prêts à être téléchargés et imprimés.
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-200/60">
                    <span>Patient</span>
                    <span className="text-slate-700 font-extrabold uppercase">{nomComplet}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-200/60">
                    <span>Diagnostic</span>
                    <span className="text-slate-700 font-extrabold">{diagnostic || "Non spécifié"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Date de Clôture</span>
                    <span className="text-slate-700 font-extrabold">{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                  {pdfReportUrl && (
                    <a
                      href={pdfReportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText size={14} /> Rapport Complet (Médecin)
                    </a>
                  )}
                  {pdfOrdonnanceUrl && (
                    <a
                      href={pdfOrdonnanceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Pill size={14} /> Ordonnance Seule (Patient)
                    </a>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3.5 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={14} /> Retourner au Tableau de Bord
                  </button>
                </div>
              </div>
            ) : (
              <>
              {/* ÉTAPE 1 : SYMPTÔMES & ANAMNÈSE */}
              {step === 1 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-slate-800 font-black uppercase text-xs tracking-widest flex items-center gap-3">
                      <Clipboard size={18} className="text-blue-500" />
                      Symptômes & Observations Cliniques
                    </h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      Étape 1 sur 3
                    </div>
                  </div>

                  {/* Saisie de tags intelligente avec auto-complétion IA */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-1">
                      Rechercher des symptômes (Base IA)
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl outline-none focus-within:border-blue-500 focus-within:bg-white transition-all">
                        <Search size={16} className="text-slate-400" />
                        <input
                          type="text"
                          value={searchSymptomQuery}
                          onChange={e => { setSearchSymptomQuery(e.target.value); setShowSearchDropdown(true); }}
                          onFocus={() => setShowSearchDropdown(true)}
                          placeholder="Ex: Toux, Fièvre, Migraine, Diarrhée..."
                          className="w-full bg-transparent outline-none border-none text-xs font-bold text-slate-700 placeholder:text-slate-300"
                        />
                        {searchSymptomQuery && (
                          <button onClick={() => setSearchSymptomQuery('')} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown d'auto-complétion */}
                      {showSearchDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-2 animate-in fade-in duration-100">
                          {searchResults.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddSymptomTag(item)}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50/50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors"
                            >
                              <span>{item.replace(/_/g, " ")}</span>
                              <Plus size={12} className="text-blue-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Liste des tags de symptômes sélectionnés */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {symptomTags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/60 border border-blue-100 rounded-full text-xs font-bold text-blue-600 shadow-sm">
                          {tag.replace(/_/g, " ")}
                          <button type="button" onClick={() => handleRemoveSymptomTag(idx)} className="text-blue-400 hover:text-blue-600 transition-colors">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Zone de texte libre pour l'examen clinique global */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        Observations Cliniques Détaillées *
                      </label>
                      {isFromTeleconsult && (
                        <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 rounded px-2 py-0.5 font-bold uppercase">
                          Transcription Audio Disponible
                        </span>
                      )}
                    </div>
                    <textarea
                      value={symptomes}
                      onChange={e => setSymptomes(e.target.value)}
                      placeholder="Décrivez les symptômes observés, le contexte clinique, ou collez des transcriptions..."
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 text-xs outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[140px] resize-none shadow-sm placeholder:text-slate-300 font-medium"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={analyzeSymptoms}
                      disabled={aiLoading}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all shadow-md disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Calcul en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Lancer l'analyse IA & Diagnostiquer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : IA CLINIQUE & DIAGNOSTIC */}
              {step === 2 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-slate-800 font-black uppercase text-xs tracking-widest flex items-center gap-3">
                      <BrainCircuit size={18} className="text-purple-600" />
                      Moteur Prédictif & Décision Médicale
                    </h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      Étape 2 sur 3
                    </div>
                  </div>

                  {/* Si l'IA n'est pas encore lancée */}
                  {!aiResult && !aiLoading && (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-purple-50 text-purple-600 border border-purple-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                        <BrainCircuit size={28} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">En attente d'analyse clinique</h4>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">Saisissez les symptômes dans l'étape 1 et lancez l'algorithme d'assistance au diagnostic.</p>
                      <button 
                        type="button" 
                        onClick={() => setStep(1)} 
                        className="px-5 py-2.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                      >
                        Saisir les symptômes
                      </button>
                    </div>
                  )}

                  {/* Résultats d'analyses IA */}
                  {aiResult && !aiLoading && (
                    <div className="space-y-6">
                      
                      {/* En-tête des variables analysées */}
                      <div className="grid grid-cols-3 gap-3 bg-purple-50/30 border border-purple-100 rounded-2xl p-4 text-[10px] font-bold text-purple-600/80 uppercase">
                        <div>Symptômes IA reconnus : <b className="text-purple-800 block text-xs mt-0.5">{aiResult.n_recognized}</b></div>
                        <div>Genre ciblé : <b className="text-purple-800 block text-xs mt-0.5">{aiResult.patient_context?.sex || "Non filtré"}</b></div>
                        <div>Fiabilité du modèle : <b className="text-emerald-600 block text-xs mt-0.5">{(aiResult.model_accuracy * 100).toFixed(1)}%</b></div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-1">
                          Pathologies probabilistes retenues
                        </label>
                        
                        <div className="space-y-3">
                          {aiResult.predictions?.map((pred, idx) => {
                            const isSelected = diagnostic === pred.disease;
                            const val = parseFloat(pred.confidence_pct);
                            const colorBar = val >= 60 ? 'bg-emerald-500' : val >= 30 ? 'bg-amber-500' : 'bg-rose-500';
                            
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setDiagnostic(pred.disease);
                                  toast.info(`Diagnostic "${pred.disease}" sélectionné.`);
                                }}
                                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                                  isSelected 
                                    ? 'border-purple-500 bg-purple-50/20 shadow-md' 
                                    : 'border-slate-100 bg-white hover:border-purple-200 hover:bg-slate-50/20'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-l-2xl"></div>
                                )}
                                
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                      isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      #{pred.rank}
                                    </span>
                                    <span className="text-xs font-black text-slate-700">{pred.disease}</span>
                                  </div>
                                  <ConfidenceBadge pct={pred.confidence_pct} />
                                </div>

                                {/* Barre de progression animée */}
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                                  <div className={`h-full ${colorBar} transition-all duration-1000 ease-out`} style={{ width: pred.confidence_pct }} />
                                </div>

                                {/* Explication médicale IA */}
                                <ExplanationPanel expl={pred.explanation} />
                              </div>
                            );
                          })}
                        </div>

                        {/* Mots non compris par le dictionnaire IA */}
                        {aiResult.symptoms_unknown?.length > 0 && (
                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
                            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-700 font-semibold leading-relaxed">
                              <span className="font-black uppercase tracking-wider block mb-0.5 text-[10px]">Termes ignorés</span>
                              Le modèle d'apprentissage clinique n'a pas analysé les termes suivants : {aiResult.symptoms_unknown.join(", ")}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Diagnostic final du médecin */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-1">
                          Diagnostic final retenu
                        </label>
                        <input
                          type="text"
                          value={diagnostic}
                          onChange={e => setDiagnostic(e.target.value)}
                          placeholder="Saisissez ou modifiez le diagnostic final..."
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider ml-1">
                          Notes de suivi & recommandations
                        </label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Instructions post-consultation, contre-indications ou notes additionnelles..."
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[80px] resize-none shadow-inner"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="px-5 py-3 border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          Retour
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={analyzeSymptoms}
                            className="px-4 py-3 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                          >
                            <RefreshCw size={12} /> Ré-analyser
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                          >
                            <Pill size={13} /> Continuer vers l'ordonnance
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ÉTAPE 3 : PHARMACIE & PRESCRIPTION */}
              {step === 3 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
                  
                  {/* En-tête */}
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-slate-800 font-black uppercase text-xs tracking-widest flex items-center gap-3">
                      <Pill size={18} className="text-emerald-600" />
                      Pharmacie & Prescription d'Ordonnance
                    </h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      Étape 3 sur 3
                    </div>
                  </div>

                  {/* Bannière diagnostic contextuel */}
                  {diagnostic && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-semibold text-emerald-800">
                        <CheckCircle size={16} className="text-emerald-500" />
                        <div>
                          <span>Diagnostic retenu : </span>
                          <strong className="font-black uppercase tracking-wider">{diagnostic}</strong>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setStep(2)} 
                        className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-800"
                      >
                        Modifier
                      </button>
                    </div>
                  )}

                  {/* Sélecteur de Médicaments Clinique */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Traitement thérapeutique</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={addFreeTextMedication}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                        >
                          <Plus size={10} /> Saisie libre
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDrugDatabase(!showDrugDatabase)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          {showDrugDatabase ? 'Fermer la liste' : 'Base Médicaments'}
                        </button>
                      </div>
                    </div>

                    {/* Pop-in Base Médicaments */}
                    {showDrugDatabase && (
                      <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="flex-1 bg-white border border-slate-200 px-3 py-2.5 rounded-xl flex items-center gap-2">
                            <Search size={14} className="text-slate-400" />
                            <input
                              type="text"
                              value={drugSearchQuery}
                              onChange={e => setDrugSearchQuery(e.target.value)}
                              placeholder="Rechercher Amoxicilline, Paracétamol..."
                              className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                            />
                          </div>
                          
                          <select
                            value={drugClassFilter}
                            onChange={e => setDrugClassFilter(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 outline-none"
                          >
                            <option value="">Toutes classes</option>
                            {drugClasses.map((cls, idx) => (
                              <option key={idx} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {filteredDrugs.map((drug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => addMedication(drug)}
                              className="w-full text-left p-3 bg-white border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/10 rounded-xl transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-black text-slate-700">{drug.name}</span>
                                <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">{drug.class}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                Dose : {drug.defaultDose} • Fréq : {drug.defaultFreq} • Voie : {drug.route}
                              </div>
                            </button>
                          ))}
                          {filteredDrugs.length === 0 && (
                            <p className="text-slate-400 text-xs italic p-4 text-center col-span-2">Aucun médicament trouvé.</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => addMedication(null)}
                          className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-all text-center"
                        >
                          + Saisie libre de médicament
                        </button>
                      </div>
                    )}

                    {/* Liste des lignes prescrites */}
                    {medications.length > 0 ? (
                      <div className="space-y-2">
                        {medications.map((med, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-50/40 border border-slate-100 rounded-2xl p-4 space-y-3 relative group"
                          >
                            <button 
                              type="button" 
                              onClick={() => removeMedication(idx)} 
                              className="absolute top-4 right-4 p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all border border-rose-100"
                            >
                              <Trash2 size={13} />
                            </button>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pr-8">
                              <div className="col-span-2 md:col-span-2 space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Médicament</span>
                                <input
                                  type="text"
                                  value={med.name}
                                  onChange={e => updateMedication(idx, "name", e.target.value)}
                                  placeholder="Ex: Paracétamol"
                                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Posologie</span>
                                <input
                                  type="text"
                                  value={med.dosage}
                                  onChange={e => updateMedication(idx, "dosage", e.target.value)}
                                  placeholder="1g / 500mg"
                                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Fréquence</span>
                                <input
                                  type="text"
                                  value={med.frequency}
                                  onChange={e => updateMedication(idx, "frequency", e.target.value)}
                                  placeholder="3×/jour"
                                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Durée</span>
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={e => updateMedication(idx, "duration", e.target.value)}
                                  placeholder="7 jours"
                                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-5 gap-3 pt-2">
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Administration</span>
                                <select
                                  value={med.route}
                                  onChange={e => updateMedication(idx, "route", e.target.value)}
                                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none"
                                >
                                  {ROUTES.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                </select>
                              </div>

                              <div className="col-span-4 space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Instructions particulières</span>
                                <input
                                  type="text"
                                  value={med.notes}
                                  onChange={e => updateMedication(idx, "notes", e.target.value)}
                                  placeholder="À prendre au milieu des repas, dissoudre dans l'eau..."
                                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-slate-100 border-dashed rounded-3xl py-12 text-center space-y-3 opacity-60">
                        <Pill size={36} className="text-slate-300 mx-auto" />
                        <p className="text-slate-400 text-xs italic font-medium">Aucun traitement médicamenteux prescrit pour le moment.</p>
                        <button
                          type="button"
                          onClick={() => { setShowDrugDatabase(true); addMedication(null); }}
                          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase"
                        >
                          Ajouter une ligne
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions de validation */}
                  <div className="pt-6 border-t border-slate-50 flex flex-col md:flex-row justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-3 border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest transition-all text-center"
                    >
                      Retour diagnostic
                    </button>
                    
                    <div className="flex flex-col md:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleSavePrescription}
                        disabled={medications.length === 0}
                        className="px-4 py-3 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Save size={12} /> Sauvegarder Ordonnance
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={saving || !symptomes.trim()}
                        className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                          saved 
                            ? 'bg-emerald-600 shadow-emerald-100' 
                            : saving 
                              ? 'bg-blue-700 shadow-blue-100 cursor-wait' 
                              : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700 active:scale-95'
                        }`}
                      >
                        {saved ? (
                          <>
                            <CheckCircle size={14} /> Consultation enregistrée !
                          </>
                        ) : saving ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Finalisation et PDF en cours...
                          </>
                        ) : (
                          <>
                            <FileText size={14} /> Finaliser la consultation & Rapport PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}

        </div>

      </div>

    </div>
  );
};

export default Consultation;