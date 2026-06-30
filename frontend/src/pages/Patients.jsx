import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Plus, Phone, Droplet, FileText, Edit2, X, AlertCircle, ShieldCheck, Users, Loader2, Calendar
} from 'lucide-react';
import usePatientStore from '../store/patientStore';
import useAuthStore from '../store/authStore'; // ✅ AJOUTÉ
import { toast } from '../store/uiStore';

const Patients = () => {
  // ✅ AJOUTÉ : Récupérer l'utilisateur connecté pour connaître son rôle
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'MEDECIN';
  const isSecretary = user?.role === 'SECRETAIRE';

  const { patients, fetchPatients, addPatientDraft, editPatient, fetchPatientDossierForDoctor } = usePatientStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la modale
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', genre: 'M', dateNaissance: '',
    telephone: '', groupeSanguin: '', cin: ''
  });

  // États pour le dossier médical complet (médecin)
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierLoading, setDossierLoading] = useState(false);

  useEffect(() => { 
    fetchPatients(); 
  }, [fetchPatients]);

  const openCreateModal = () => {
    setEditingPatient(null);
    setFormData({ nom: '', prenom: '', genre: 'M', dateNaissance: '', telephone: '', groupeSanguin: '', cin: '' });
    setShowModal(true);
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({
      id: patient.id,
      is_draft: patient.is_draft,
      nom: patient.nom || '',
      prenom: patient.prenom || '',
      genre: patient.genre || 'M',
      dateNaissance: patient.dateNaissance || '',
      telephone: patient.telephone || '',
      groupeSanguin: patient.groupeSanguin || '',
      cin: patient.cin || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let res;
    if (editingPatient) {
      res = await editPatient(formData);
    } else {
      res = await addPatientDraft(formData);
    }

    if (res.success) {
      setShowModal(false);
    } else {
      toast.error("Une erreur s'est produite lors de l'enregistrement.");
    }
  };

  const handleViewDossier = async (patientId) => {
    setDossierLoading(true);
    setSelectedDossier(null);
    setShowDossierModal(true);
    const res = await fetchPatientDossierForDoctor(patientId);
    setDossierLoading(false);
    if (res.success) {
      setSelectedDossier(res.data);
    } else {
      toast.error("Impossible de charger le dossier médical.");
      setShowDossierModal(false);
    }
  };

  // ✅ MODIFIÉ : Filtrer les patients - pour le médecin, cacher les drafts
  const filteredPatients = patients.filter(p => {
    // Si c'est un médecin, il ne voit PAS les drafts
    if (isDoctor && p.is_draft) {
      return false;
    }
    // Filtre de recherche normal
    return (p.nom + ' ' + p.prenom).toLowerCase().includes(searchTerm.toLowerCase()) || 
           (p.telephone || '').includes(searchTerm);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
        <div>
          {/* ✅ MODIFIÉ : Titre dynamique selon le rôle */}
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            {isDoctor ? 'Mes Patients' : 'Répertoire Patients'}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {filteredPatients.length} dossier{filteredPatients.length > 1 ? 's' : ''} enregistré{filteredPatients.length > 1 ? 's' : ''}
          </p>
          {/* ✅ AJOUTÉ : Message d'info pour le médecin */}
          {isDoctor && (
            <p className="text-slate-300 text-[9px] mt-0.5">
              * Seuls les patients ayant déjà consulté apparaissent ici
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher (nom, tél)..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium text-slate-700" 
            />
          </div>
          {/* ✅ MODIFIÉ : Le bouton "Nouveau Patient" n'apparaît que pour la secrétaire */}
          {isSecretary && (
            <button 
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap shadow-md shadow-blue-500/20"
            >
               <Plus size={16} /> Nouveau Patient
            </button>
          )}
        </div>
      </div>

      {/* TABLEAU COMPACT */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & CIN</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Info Médicale</th>
                {/* ✅ MODIFIÉ : La colonne Statut n'apparaît que pour la secrétaire */}
                {!isDoctor && (
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                )}
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => (
                <tr key={`${p.is_draft ? 'draft' : 'off'}-${p.id}`} className="hover:bg-slate-50 transition-colors group">
                  
                  {/* Colonne Patient */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      {/* ✅ MODIFIÉ : Couleur différente pour les drafts (si affichés) */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${p.is_draft && isSecretary ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {p.prenom?.[0]}{p.nom?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{p.prenom} {p.nom}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                          {p.genre === 'M' ? 'Homme' : 'Femme'} {p.dateNaissance ? `• ${new Date(p.dateNaissance).toLocaleDateString('fr-FR')}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Colonne Contact */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400"/> {p.telephone || '--'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">CIN: {p.cin || '--'}</span>
                    </div>
                  </td>

                  {/* Colonne Médicale */}
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 text-[10px] font-black">
                      <Droplet size={12} /> {p.groupeSanguin || '?'}
                    </span>
                  </td>

                  {/* ✅ MODIFIÉ : Colonne Statut - seulement pour secrétaire */}
                  {!isDoctor && (
                    <td className="py-4 px-6">
                      {p.is_draft ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <AlertCircle size={12}/> En attente de 1ère visite
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <ShieldCheck size={12}/> Dossier Officiel
                        </span>
                      )}
                    </td>
                  )}

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* ✅ MODIFIÉ : Seule la secrétaire peut modifier (le médecin ne peut pas modifier les infos patient) */}
                      {isSecretary && (
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Modifier les informations"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {isDoctor && (
                        <button 
                          onClick={() => handleViewDossier(p.id)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          title="Voir le dossier complet"
                        >
                          <FileText size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredPatients.length === 0 && (
                <tr>
                  {/* ✅ MODIFIÉ : colSpan dynamique selon si la colonne Statut est affichée */}
                  <td colSpan={isDoctor ? 4 : 5} className="py-16 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold">Aucun patient ne correspond à votre recherche.</p>
                    {/* ✅ AJOUTÉ : Message spécifique pour le médecin */}
                    {isDoctor && patients.filter(p => !p.is_draft).length === 0 && (
                      <p className="text-xs mt-1">Les patients apparaîtront après leur première consultation</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRÉATION / ÉDITION - Uniquement pour la secrétaire */}
      {showModal && isSecretary && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {editingPatient ? 'Modifier les informations' : 'Ajouter un nouveau patient'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={18}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nom *</label>
                  <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prénom *</label>
                  <input type="text" required value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Téléphone *</label>
                  <input type="text" required value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">N° CIN</label>
                  <input type="text" value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date de naissance</label>
                  <input type="date" value={formData.dateNaissance} onChange={e => setFormData({...formData, dateNaissance: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Genre</label>
                  <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Groupe Sanguin</label>
                  <select value={formData.groupeSanguin} onChange={e => setFormData({...formData, groupeSanguin: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50">
                    <option value="">Non spécifié</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
                  {editingPatient ? 'Enregistrer' : 'Créer le patient'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DOSSIER CLINIQUE - Uniquement pour le médecin */}
      {showDossierModal && isDoctor && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-slate-100 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  Dossier Médical
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                  Accès réservé - secret médical professionnel
                </p>
              </div>
              <button 
                onClick={() => { setShowDossierModal(false); setSelectedDossier(null); }} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18}/>
              </button>
            </div>

            {/* Content Body */}
            {dossierLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-blue-600 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Chargement du dossier médical...</span>
              </div>
            ) : selectedDossier ? (
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* COLONNE INFOS PATIENT */}
                <div className="md:col-span-1 space-y-6">
                  {/* Fiche Identité */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-base border border-blue-200">
                        {selectedDossier.patient.prenom?.[0]}{selectedDossier.patient.nom?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 leading-tight">
                          {selectedDossier.patient.prenom} {selectedDossier.patient.nom}
                        </p>
                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mt-1">
                          Patient Officiel
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">CIN</span>
                        <span className="font-bold text-slate-700">{selectedDossier.patient.cin || '--'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Genre</span>
                        <span className="font-bold text-slate-700">{selectedDossier.patient.genre === 'M' ? 'Homme' : 'Femme'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Naissance</span>
                        <span className="font-bold text-slate-700">
                          {selectedDossier.patient.dateNaissance ? new Date(selectedDossier.patient.dateNaissance).toLocaleDateString('fr-FR') : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Téléphone</span>
                        <span className="font-bold text-blue-600">{selectedDossier.patient.telephone || '--'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fiche Médicale */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Groupe Sanguin</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-lg text-xs font-black text-red-600">
                        <Droplet size={12} /> {selectedDossier.patient.groupeSanguin || '--'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Allergies</span>
                      {selectedDossier.patient.allergies ? (
                        <p className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">
                          {selectedDossier.patient.allergies}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-white border border-slate-100 rounded-xl p-2.5">
                          Aucune allergie renseignée.
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Antécédents</span>
                      {selectedDossier.patient.antecedents ? (
                        <p className="text-xs text-slate-700 font-bold bg-white border border-slate-150 rounded-xl p-3 leading-relaxed">
                          {selectedDossier.patient.antecedents}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-white border border-slate-100 rounded-xl p-2.5">
                          Aucun antécédent médical.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* COLONNE HISTORIQUE CONSULTATIONS */}
                <div className="md:col-span-2 space-y-4 font-sans">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center justify-between">
                    <span>Historique Clinique</span>
                    <span className="text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg font-extrabold text-[10px]">
                      {selectedDossier.nb_consultations} Consultation(s)
                    </span>
                  </h3>

                  {selectedDossier.consultations.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <FileText className="mx-auto mb-2 text-slate-300" size={24} />
                      <p className="text-xs text-slate-400 italic font-semibold">Aucune consultation enregistrée pour le moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                      {selectedDossier.consultations.map((c) => (
                        <div key={c.id} className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-slate-300 transition-all space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">
                                Consultation du {new Date(c.date_consultation).toLocaleDateString('fr-FR')}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                Par Dr. {c.medecin_nom || 'Médecin'}
                              </p>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                              c.rdv_type === 'VISIO' 
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}>
                              {c.rdv_type || 'Cabinet'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Symptômes</span>
                              <p className="font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">{c.symptomes || '--'}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Diagnostic</span>
                              <p className="font-extrabold text-indigo-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 mt-1">{c.diagnostic || '--'}</p>
                            </div>
                          </div>

                          {c.notes && (
                            <div className="text-xs">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Notes Cliniques</span>
                              <p className="text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 mt-1 whitespace-pre-line font-medium">{c.notes}</p>
                            </div>
                          )}

                          {c.ordonnance && c.ordonnance.medicaments && c.ordonnance.medicaments.length > 0 && (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block">Ordonnance Prescrite</span>
                              <ul className="space-y-1.5">
                                {c.ordonnance.medicaments.map((m) => (
                                  <li key={m.id} className="text-xs text-slate-700 font-bold flex items-center justify-between bg-white border border-emerald-200/40 rounded-lg p-1.5 px-2.5">
                                    <span>💊 {m.nom}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{m.dosage} — {m.posologie}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">Une erreur s'est produite lors du chargement des données.</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Patients;