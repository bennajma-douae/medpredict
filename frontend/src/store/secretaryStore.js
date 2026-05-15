import { create } from 'zustand';
import axios from 'axios';

const useSecretaryStore = create((set, get) => ({
  // ✅ AJOUTÉ : Gestion de l'onglet actif pour la sidebar
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  requests: [],
  allAppointments:[],
  stats: { total: 0, pending: 0, today: 0, totalPatients: 0, occupation: 0 },
  loading: false,

  fetchRequests: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer tous les RDV
      const resRdv = await axios.get('http://localhost:8000/api/appointments/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Récupérer les stats patients
      const resPatients = await axios.get('http://localhost:8000/api/patients/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const drafts = resPatients.data.filter(p => !p.user); // Drafts n'ont pas de user lié officiellement
      const official = resPatients.data.filter(p => p.user);
      
      const pending = resRdv.data.filter(r => r.statut === 'EN_ATTENTE');
      const todayStr = new Date().toISOString().split('T')['0'];
      const todayConfirmed = resRdv.data.filter(r => r.date === todayStr && r.statut === 'CONFIRME');
      
      // Calcul taux d'occupation (créneaux pris / créneaux totaux)
      const totalSlots = 7 * 8; // 7 jours, 8 créneaux par jour
      const occupiedSlots = resRdv.data.filter(r => r.statut === 'CONFIRME').length;
      const occupation = Math.round((occupiedSlots / totalSlots) * 100);

      set({ 
        requests: pending,
        allAppointments: resRdv.data,
        stats: {
          pending: pending.length,
          today: todayConfirmed.length,
          total: resRdv.data.length,
          totalPatients: resPatients.data.length,
          occupation: Math.min(occupation, 100)
        },
        loading: false 
      });
    } catch (err) { 
      console.error("Erreur fetchRequests:", err);
      set({ loading: false }); 
    }
  },

  confirmRequest: async (rdvId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8000/api/appointments/${rdvId}/confirmer/`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      get().fetchRequests();
      return { success: true };
    } catch (err) { 
      console.error("Erreur confirmRequest:", err);
      return { success: false, error: err.response?.data }; 
    }
  },

  cancelRequest: async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8000/api/appointments/${id}/annuler/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchRequests();
      return { success: true };
    } catch (err) { 
      console.error("Erreur cancelRequest:", err);
      return { success: false, error: err.response?.data }; 
    }
  },

  rescheduleRequest: async (rdvId, newData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8000/api/appointments/${rdvId}/`, newData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Erreur rescheduleRequest:", err);
      return { success: false, error: err.response?.data };
    }
  }
}));

export default useSecretaryStore;