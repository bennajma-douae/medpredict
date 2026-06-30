import { create } from 'zustand';
import axios from 'axios';

const useAppointmentStore = create((set, get) => ({
  appointments: [],       // Tous les RDV confirmés (pour le calendrier)
  todayAppointments: [],  // Uniquement ceux d'aujourd'hui (pour le compteur KPI)
  loading: false,

  fetchAppointments: async () => {
    set({ loading: true });
    try {
      const d = new Date();
      const day = d.getDay();
      // Si on est samedi (6) ou dimanche (0), la date active d'intérêt est le lundi suivant
      if (day === 0) { // Dimanche
        d.setDate(d.getDate() + 1);
      } else if (day === 6) { // Samedi
        d.setDate(d.getDate() + 2);
      }
      
      const getLocalYYYYMMDD = (dateObj) => {
        return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      };
      
      const today = getLocalYYYYMMDD(d);
      
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/appointments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 1. On ne garde que les RDV validés par la secrétaire (CONFIRME ou TERMINE)
      // On ignore les "EN_ATTENTE" pour le médecin
      const confirmedOnly = res.data.filter(a => 
        a.statut === 'CONFIRME' || a.statut === 'TERMINE'
      );

      // 2. On filtre ceux qui sont spécifiquement pour la journée active (Aujourd'hui ou Lundi si week-end)
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