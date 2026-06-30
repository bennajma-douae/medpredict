import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    
    // Disparition automatique après 8 secondes
    setTimeout(() => {
      get().removeToast(id);
    }, 8000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  confirmDialog: null,
  showConfirm: (message, title = "Confirmation") => {
    return new Promise((resolve) => {
      set({
        confirmDialog: {
          title,
          message,
          onConfirm: () => {
            set({ confirmDialog: null });
            resolve(true);
          },
          onCancel: () => {
            set({ confirmDialog: null });
            resolve(false);
          }
        }
      });
    });
  }
}));

// Helpers pour faciliter l'utilisation partout sans importer le store entier
export const toast = {
  success: (msg) => useUIStore.getState().addToast(msg, 'success'),
  error: (msg) => useUIStore.getState().addToast(msg, 'error'),
  info: (msg) => useUIStore.getState().addToast(msg, 'info'),
  warning: (msg) => useUIStore.getState().addToast(msg, 'warning'),
};

export const confirmAlert = (msg, title) => useUIStore.getState().showConfirm(msg, title);

export default useUIStore;
