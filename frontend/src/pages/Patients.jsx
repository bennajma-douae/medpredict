import React, { useEffect, useState } from 'react';
import { 
  Search, Plus, UserPlus, X, Phone, Droplet, Users, ClipboardList
} from 'lucide-react';
import usePatientStore from '../store/patientStore';

const Patients = () => {
  const { patients, fetchPatients, addPatient, loading } = usePatientStore();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nom: '', prenom: '', genre: 'M', dateNaissance: '',
    telephone: '', groupeSanguin: 'A+', allergies: ''
  });

  // On charge les données au montage du composant
  useEffect(() => { fetchPatients(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await addPatient(formData);
    if (res.success) {
      setShowForm(false);
      setFormData({ nom: '', prenom: '', genre: 'M', dateNaissance: '', telephone: '', groupeSanguin: 'A+', allergies: '' });
    }
  };

  const filteredPatients = patients.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Gestion Patients</h1>
          <p className="text-slate-500 text-sm font-medium">Flux de données réel de PostgreSQL</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
        >
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm ? "Annuler" : "Inscrire un Patient"}
        </button>
      </div>

      {/* FORMULAIRE (Slide down) */}
      {showForm && (
        <div className="glass p-8 rounded-[40px] border-blue-500/20 animate-in slide-in-from-top duration-300">
           <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6">
              {/* Champs du formulaire */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nom</label>
                <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="Nom du patient" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Prénom</label>
                <input type="text" required value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="Prénom du patient" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Genre</label>
                <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500">
                   <option value="M">Masculin</option>
                   <option value="F">Féminin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Date de naissance</label>
                <input type="date" required value={formData.dateNaissance} onChange={e => setFormData({...formData, dateNaissance: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Téléphone</label>
                <input type="text" required value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="06..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Groupe Sanguin</label>
                <select value={formData.groupeSanguin} onChange={e => setFormData({...formData, groupeSanguin: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500">
                   {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button type="submit" className="md:col-span-3 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                Créer le dossier médical
              </button>
           </form>
        </div>
      )}

      {/* ZONE DE LISTE OU ÉTAT VIDE */}
      <div className="glass rounded-[40px] border-white/5 min-h-[400px] overflow-hidden flex flex-col">
        {patients.length > 0 ? (
          <>
            <div className="p-8 border-b border-white/5">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none focus:border-blue-500/50 text-white" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="p-6">Identité</th>
                    <th className="p-6">Sanguin</th>
                    <th className="p-6">Contact</th>
                    <th className="p-6 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="p-6 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 font-black text-xs">{p.nom[0]}{p.prenom[0]}</div>
                        <div>
                          <p className="text-sm font-black text-white">{p.nom} {p.prenom}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{p.genre} • {p.dateNaissance}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-2 w-fit">
                          <Droplet size={12}/> {p.groupeSanguin}
                        </span>
                      </td>
                      <td className="p-6 text-xs font-bold text-slate-400">{p.telephone}</td>
                      <td className="p-6 text-right">
                        <button className="text-blue-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">Ouvrir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* ÉTAT VIDE : CE QUE LE MÉDECIN VOIT À L'OUVERTURE DU CABINET */
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mb-6">
               <Users size={48} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Aucun patient enregistré</h3>
            <p className="text-slate-500 max-w-xs mt-2 text-sm leading-relaxed">
              Votre base de données est vide. Commencez par inscrire votre premier patient pour activer le système.
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-8 text-blue-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:underline"
            >
               <Plus size={16} /> Créer le premier dossier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;