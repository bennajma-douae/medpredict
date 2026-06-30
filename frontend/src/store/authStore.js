import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
    // On initialise l'utilisateur à partir du localStorage s'il existe
    user: JSON.parse(localStorage.getItem('user')) || null, 
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),

    login: async (username, password) => {
        try {
            // 1. On récupère le Token JWT
            const response = await axios.post('http://localhost:8000/api/token/', {
                username,
                password
            });
            
            const { access } = response.data;
            localStorage.setItem('token', access);
            
            // 2. ÉTAPE CRUCIALE : On récupère les infos de l'utilisateur (pour avoir son rôle)
            // On appelle l'API users que nous avons créée dans le backend
            const userResponse = await axios.get('http://localhost:8000/api/users/', {
                headers: { Authorization: `Bearer ${access}` }
            });

            // On trouve l'utilisateur qui correspond au nom d'utilisateur saisi
            const userData = userResponse.data.find(u => u.username === username);
            
            // On sauvegarde l'objet utilisateur complet (id, username, email, role)
            localStorage.setItem('user', JSON.stringify(userData));
            
            set({ 
                token: access, 
                user: userData,
                isAuthenticated: true 
            });

            return { success: true, role: userData.role };
        } catch (error) {
            console.error("Erreur de connexion", error);
            return { success: false, error: "Identifiants invalides ou problème serveur" };
        }
    },

    logout: () => {
        // On nettoie tout lors de la déconnexion
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    setUser: (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        set({ user: userData });
    }
}));

export default useAuthStore;