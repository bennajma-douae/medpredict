import { create } from 'zustand';
import axios from 'axios';

const useSecretaryStore = create((set, get) => ({
  // ✅ AJOUTÉ : Gestion de l'onglet actif pour la sidebar
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  requests: [],
  allAppointments:[],
  allMessages: [], // ✅ Tous les messages pour le chat
  unreadChatCount: 0, // ✅ Nombre de messages non lus
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

      const drafts = resPatients.data.filter(p => !p.user);
      const official = resPatients.data.filter(p => p.user);
      
      const pending = resRdv.data.filter(r => 
        ['EN_ATTENTE', 'PROPOSE', 'PATIENT_ACCEPTE', 'PATIENT_REFUSE'].includes(r.statut)
      );
      const todayStr = new Date().toISOString().split('T')['0'];
      const todayConfirmed = resRdv.data.filter(r => r.date === todayStr && r.statut === 'CONFIRME');
      
      const totalSlots = 7 * 8;
      const occupiedSlots = resRdv.data.filter(r => r.statut === 'CONFIRME').length;
      const occupation = Math.round((occupiedSlots / totalSlots) * 100);

      // ✅ Fetch all messages to calculate unread count
      let unreadCount = 0;
      let allMsgs = [];
      try {
        const resChat = await axios.get('http://localhost:8000/api/chat/', {
           headers: { Authorization: `Bearer ${token}` }
        });
        allMsgs = resChat.data;
        
        // Calcul des non-lus en fonction du localStorage
        const lastRead = JSON.parse(localStorage.getItem('chat_last_read') || '{}');
        
        // Group messages by patient to find the latest
        const latestByPatient = {};
        allMsgs.forEach(m => {
           if (!latestByPatient[m.patient_user] || new Date(m.timestamp) > new Date(latestByPatient[m.patient_user].timestamp)) {
              latestByPatient[m.patient_user] = m;
           }
        });
        
        Object.keys(latestByPatient).forEach(patientId => {
           const lastMsg = latestByPatient[patientId];
           if (!lastMsg.is_from_secretary) {
              const readTime = lastRead[patientId];
              if (!readTime || new Date(lastMsg.timestamp) > new Date(readTime)) {
                 unreadCount++;
              }
           }
        });
      } catch (e) {
        console.error("Erreur fetch chat global", e);
      }

      set({ 
        requests: pending,
        allAppointments: resRdv.data,
        allMessages: allMsgs,
        unreadChatCount: unreadCount,
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

  markChatAsRead: (patientId) => {
    const lastRead = JSON.parse(localStorage.getItem('chat_last_read') || '{}');
    lastRead[patientId] = new Date().toISOString();
    localStorage.setItem('chat_last_read', JSON.stringify(lastRead));
    get().fetchRequests(); // Recalculer le badge global
  },

  confirmRequest: async (rdvId) => {
    // Vérifier si le RDV est déjà passé
    const rdv = get().requests.find(r => r.id === rdvId) || get().allAppointments.find(r => r.id === rdvId);
    
    if (rdv && rdv.date && rdv.heure) {
      const rdvDateTime = new Date(`${rdv.date}T${rdv.heure}`);
      const now = new Date();
      
      if (rdvDateTime < now) {
        return { 
          success: false, 
          error: "Ce rendez-vous est déjà passé. Vous pouvez le déplacer à une autre date." 
        };
      }
    }

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
      await axios.patch(`http://localhost:8000/api/appointments/${rdvId}/deplacer/`, newData, {
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