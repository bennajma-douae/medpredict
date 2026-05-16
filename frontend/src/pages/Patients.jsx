import React, { useEffect, useState } from 'react';
import { 
  Search, Plus, Phone, Droplet, FileText, Edit2, X, AlertCircle, ShieldCheck , Users
} from 'lucide-react';
import usePatientStore from '../store/patientStore';
import useAuthStore from '../store/authStore'; // ✅ AJOUTÉ
import { toast } from '../store/uiStore';

const Patients = () => {
  // ✅ AJOUTÉ : Récupérer l'utilisateur connecté pour connaître son rôle
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'MEDECIN';
  const isSecretary = user?.role === 'SECRETAIRE';

  const { patients, fetchPatients, addPatientDraft, editPatient } = usePatientStore();
  const[searchTerm, setSearchTerm] = useState('');
  
  // États pour la modale
  const[showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', genre: 'M', dateNaissance: '',
    telephone: '', groupeSanguin: '', cin: ''
  });

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
                      <button 
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Voir le dossier complet"
                      >
                        <FileText size={16} />
                      </button>
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
      {showModal && isSecretary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {editingPatient ? 'Modifier les informations' : 'Ajouter un nouveau patient'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom *</label>
                  <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prénom *</label>
                  <input type="text" required value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="w-full border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone *</label>
                  <input type="text" required value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="w-full border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N° CIN</label>
                  <input type="text" value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} className="w-full border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de naissance</label>
                  <input type="date" value={formData.dateNaissance} onChange={e => setFormData({...formData, dateNaissance: e.target.value})} className="w-full border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genre</label>
                  <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Groupe Sanguin</label>
                  <select value={formData.groupeSanguin} onChange={e => setFormData({...formData, groupeSanguin: e.target.value})} className="w-full border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50">
                    <option value="">Non spécifié</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                  {editingPatient ? 'Enregistrer' : 'Créer le patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;