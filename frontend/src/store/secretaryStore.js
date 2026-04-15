import { create } from 'zustand';
import axios from 'axios';

const useSecretaryStore = create((set, get) => ({
  requests: [],
  loading: false,

  fetchRequests: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      // On récupère tous les rendez-vous dont le statut est 'EN_ATTENTE'
      const res = await axios.get('http://localhost:8000/api/appointments/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ requests: res.data.filter(r => r.statut === 'EN_ATTENTE'), loading: false });
    } catch (err) { set({ loading: false }); }
  },

  // LA FONCTION CRUCIALE : Accepter et Créer le Patient
  acceptRequest: async (request) => {
    try {
      const token = localStorage.getItem('token');
      
      // 1. Créer le dossier Patient réel (BF-01)
      const patientRes = await axios.post('http://localhost:8000/api/patients/', {
        user: request.user, // On le lie à son compte User
        nom: "A compléter", // Sera rempli par le médecin
        prenom: "A compléter",
        dateNaissance: "2000-01-01", 
        telephone: "0600000000"
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 2. Mettre à jour le Rendez-vous (Lier au patient + Confirmer)
      await axios.patch(`http://localhost:8000/api/appointments/${request.id}/`, {
        patient: patientRes.data.id,
        statut: 'CONFIRME'
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 3. Rafraîchir la liste
      get().fetchRequests();
      return { success: true };
    } catch (err) { return { success: false }; }
  }
}));

export default useSecretaryStore;