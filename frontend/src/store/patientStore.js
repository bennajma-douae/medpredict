import { create } from 'zustand';
import axios from 'axios';

const usePatientStore = create((set, get) => ({
  // --- ÉTATS ---
  patients:[],      // Liste pour le staff (Médecin/Secrétaire)
  doctorPatients:[], // ✅ NOUVEAU : Liste spécifique pour le médecin (uniquement officiels)
  fullDossier: null, // Dossier complet pour le Patient connecté
  loading: false,

  // --- ACTIONS STAFF (Secrétaire / Médecin) ---
  
  // 1. Récupérer tous les patients (Drafts + Officiels) - pour SECRETAIRE uniquement
  fetchPatients: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/patients/liste-complete/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ patients: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error("Erreur API :", err);
    }
  },

  // ✅ NOUVEAU : 1bis. Récupérer uniquement les patients officiels - pour MEDECIN
  fetchDoctorPatients: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      // Appel à l'API standard qui ne retourne que les patients officiels
      const res = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ doctorPatients: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error("Erreur API docteur :", err);
    }
  },

  // ✅ NOUVEAU : Méthode intelligente qui choisit selon le rôle de l'utilisateur
  fetchPatientsByRole: async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'SECRETAIRE') {
      return get().fetchPatients();
    } else if (user.role === 'MEDECIN') {
      return get().fetchDoctorPatients();
    } else {
      // Fallback: méthode originale
      return get().fetchPatients();
    }
  },

  // 2. Créer un patient (Brouillon) - RESERVE A LA SECRETAIRE
  addPatientDraft: async (patientData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/patients/creer-brouillon/', patientData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Rafraîchir selon le rôle
      get().fetchPatientsByRole();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data };
    }
  },

  // 3. Modifier les infos de base d'un patient
  editPatient: async (patientData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:8000/api/patients/modifier-patient/', patientData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Rafraîchir selon le rôle
      get().fetchPatientsByRole();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data };
    }
  },

  // ✅ NOUVEAU : Supprimer un patient (optionnel, pour admin/secrétaire)
  deletePatient: async (patientId, isDraft = false) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isDraft 
        ? `http://localhost:8000/api/patients/drafts/${patientId}/`
        : `http://localhost:8000/api/patients/${patientId}/`;
      
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchPatientsByRole();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data };
    }
  },

  // --- ACTIONS PATIENT CONNECTÉ (Inchangées - votre travail reste intact) ---

  // 1. Récupérer le dossier médical complet (Profil + Consultations)
  fetchFullDossier: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/patients/me/dossier/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ fullDossier: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error("Erreur chargement dossier complet :", err);
    }
  },

  // 2. Mettre à jour les informations de profil du patient
  updateProfile: async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch('http://localhost:8000/api/patients/me/update/', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mise à jour locale de fullDossier pour que l'UI change instantanément
      const currentDossier = get().fullDossier;
      if (currentDossier) {
        set({ 
          fullDossier: { ...currentDossier, patient: res.data } 
        });
      }
      
      return { success: true };
    } catch (err) {
      console.error("Erreur mise à jour profil :", err);
      return { success: false, error: err.response?.data };
    }
  },

  // ✅ NOUVEAU : Obtenir un patient par son ID
  getPatientById: async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/patients/${patientId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data };
    }
  }
}));

export default usePatientStore;