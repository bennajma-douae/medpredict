import { create } from 'zustand';
import axios from 'axios';

const useAppointmentStore = create((set) => ({
  todayAppointments: [],
  
  fetchTodayAgenda: async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`http://localhost:8000/api/appointments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // On ne garde que les RDV confirmés de AUJOURD'HUI
      const filtered = res.data.filter(a => a.date === today && a.statut === 'CONFIRME');
      set({ todayAppointments: filtered });
    } catch (err) { console.error(err); }
  }
}));

export default useAppointmentStore;