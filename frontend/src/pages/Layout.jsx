import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  LogOut, Bell, User, FileText, Stethoscope, Activity,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';

// Définition du composant SidebarItem
const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 w-full rounded-xl cursor-pointer transition-all duration-200 relative no-underline ${
      active 
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
    } ${collapsed ? 'justify-center' : ''}`}
    title={collapsed ? label : ''}
  >
    <Icon size={18} className={active ? 'text-white' : ''} />
    {!collapsed && <span className="font-bold text-xs flex-1 text-left">{label}</span>}
  </button>
);

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMedecin = user?.role === 'MEDECIN';
  
  const menuItems = isMedecin ? [
    { icon: LayoutDashboard, label: "Mon Agenda", path: "/dashboard" },
    { icon: Users, label: "Mes Patients", path: "/patients" },
    { icon: Activity, label: "Statistiques", path: "/stats" },
  ] : [
    { icon: User, label: "Mes Infos", path: "/patient-dashboard" },
    { icon: Calendar, label: "Mes RDV", path: "/patient-appointments" },
    { icon: FileText, label: "Mon Dossier", path: "/patient-record" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col shadow-sm transition-all duration-300 z-20 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex items-center gap-3 p-6 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg flex-shrink-0">
            <Stethoscope size={20} />
          </div>
          {!collapsed && (
            <div className="text-left">
              <span className="text-lg font-black text-slate-800 tracking-tight italic">MedPredict</span>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Portail Praticien</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="mx-4 mt-4 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {!collapsed && (
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 px-3">
              Menu Principal
            </p>
          )}
          
          {menuItems.map((item, idx) => (
            <SidebarItem
              key={idx}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className={`flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-xs ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Déconnexion' : ''}
          >
            <LogOut size={18} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="font-bold text-sm text-slate-700">
             Bonjour, Dr. <span className="text-blue-600">{user?.username}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-xs leading-none text-slate-800">{user?.username}</p>
                <p className="text-[9px] font-black uppercase text-blue-600 mt-1">{user?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;