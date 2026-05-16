import React from 'react';
import useUIStore from '../store/uiStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastIcon = ({ type }) => {
  switch (type) {
    case 'success': return <CheckCircle className="text-emerald-500" size={20} />;
    case 'error': return <AlertCircle className="text-red-500" size={20} />;
    case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
    default: return <Info className="text-blue-500" size={20} />;
  }
};

export const GlobalUI = () => {
  const { toasts, removeToast, confirmDialog } = useUIStore();

  return (
    <>
      {/* ===== TOASTS CONTAINER ===== */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className="bg-white border border-slate-100 shadow-xl rounded-xl p-4 flex items-start gap-3 min-w-[300px] max-w-md animate-in slide-in-from-right-8 fade-in duration-300"
          >
            <ToastIcon type={t.type} />
            <div className="flex-1 mt-0.5">
              <p className="text-sm font-bold text-slate-800">{t.message}</p>
            </div>
            <button 
              onClick={() => removeToast(t.id)} 
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* ===== CONFIRM DIALOG ===== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-in-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 text-amber-600 p-3 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-800">{confirmDialog.title}</h3>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-8">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={confirmDialog.onCancel}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
