import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Inbox, Calendar, Users, BarChart3, LogOut, Bell, 
  Menu, X, ChevronLeft, ChevronRight, Stethoscope
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSecretaryStore from '../store/secretaryStore';

const SecretaryLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const[showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuthStore();
  
  // ✅ MODIFIÉ : On récupère l'onglet actif et la fonction pour le changer
  const { stats, activeTab, setActiveTab } = useSecretaryStore();
  
  const navigate = useNavigate();
  const location = useLocation();

  const pendingCount = stats?.pending ?? 0;

  // ✅ MODIFIÉ : Utilisation de "id" pour gérer les onglets
  const menuItems =[
    { icon: Inbox, label: "Demandes", id: "dashboard", badge: pendingCount },
    { icon: Calendar, label: "Agenda", id: "agenda" },
    { icon: Users, label: "Patients", id: "patients" },
    { icon: BarChart3, label: "Statistiques", id: "stats" },
  ];

  // Vérifie si on est sur la route /patients pour colorer le bouton "Patients"
  const isPatientsRoute = location.pathname === '/patients';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col shadow-sm transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <button 
          onClick={() => { setActiveTab('dashboard'); navigate('/dashboard'); }}
          className={`flex items-center gap-3 p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Stethoscope size={22} />
          </div>
          {!collapsed && (
            <div className="text-left">
              <span className="text-xl font-black text-slate-800 tracking-tight italic">MedPredict</span>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Espace Secrétariat</p>
            </div>
          )}
        </button>

        <button 
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          className="mx-4 mt-4 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {!collapsed && (
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 px-4">
              Menu Principal
            </p>
          )}
          
          {menuItems.map((item) => {
            // Un item est actif si c'est l'onglet courant (sur le dashboard) OU si c'est la page /patients
            const active = item.id === 'patients' ? isPatientsRoute : (!isPatientsRoute && activeTab === item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'patients') {
                    navigate('/patients');
                  } else {
                    setActiveTab(item.id);
                    if (location.pathname !== '/dashboard') {
                      navigate('/dashboard');
                    }
                  }
                }}
                className={`flex items-center w-full gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 relative no-underline ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <item.icon size={20} className={active ? 'text-white' : ''} />
                {!collapsed && (
                  <>
                    <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        active ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className={`flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Déconnexion' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg text-slate-700">
              {isPatientsRoute ? "Patients" : menuItems.find(m => m.id === activeTab)?.label || 'Tableau de bord'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all relative"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notifications</h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      {pendingCount} en attente
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {pendingCount > 0 ? (
                      <div className="p-3 text-xs text-slate-600">
                        <p className="font-bold mb-1">📥 {pendingCount} demande(s) de RDV</p>
                        <p className="text-slate-400">Nouvelles demandes en attente de confirmation</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 p-4 text-center">Aucune notification</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profil */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-sm leading-none text-slate-800">{user?.username}</p>
                <p className="text-[9px] font-black uppercase text-indigo-600 mt-1">Secrétaire</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SecretaryLayout;