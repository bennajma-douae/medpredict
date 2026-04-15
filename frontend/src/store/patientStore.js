import { create } from 'zustand';
import axios from 'axios';

const usePatientStore = create((set, get) => ({
  patients: [], // Liste vide au départ
  loading: false,

  // 1. LIRE : Récupérer les vrais patients de PostgreSQL
  fetchPatients: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ patients: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error("Erreur API :", err);
    }
  },

  // 2. CRÉER : Envoyer un nouveau patient à la base de données
  addPatient: async (patientData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/patients/', patientData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // On rafraîchit la liste avec le nouveau patient retourné par Django
      set({ patients: [...get().patients, res.data] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data };
    }
  }
}));

export default usePatientStore;