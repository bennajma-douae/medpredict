import { create } from 'zustand';
import axios from 'axios';

const useAppointmentStore = create((set, get) => ({
  appointments: [],       // Tous les RDV confirmés (pour le calendrier)
  todayAppointments: [],  // Uniquement ceux d'aujourd'hui (pour le compteur KPI)
  loading: false,

  fetchAppointments: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const res = await axios.get(`http://localhost:8000/api/appointments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 1. On ne garde que les RDV validés par la secrétaire (CONFIRME ou TERMINE)
      // On ignore les "EN_ATTENTE" pour le médecin
      const confirmedOnly = res.data.filter(a => 
        a.statut === 'CONFIRME' || a.statut === 'TERMINE'
      );

      // 2. On filtre ceux qui sont spécifiquement pour AUJOURD'HUI (pour le Dashboard)
      const todayOnly = confirmedOnly.filter(a => a.date === today);

      set({ 
        appointments: confirmedOnly, 
        todayAppointments: todayOnly,
        loading: false 
      });
    } catch (err) { 
      set({ loading: false });
      console.error("Erreur lors de la récupération de l'agenda:", err); 
    }
  }
}));

export default useAppointmentStore;