import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
LayoutDashboard, Users, Calendar, ClipboardList,
LogOut, Bell, User, FileText, Stethoscope, Activity
} from 'lucide-react';
import useAuthStore from '../store/authStore';
// Définition du composant SidebarItem (NE PAS OUBLIER)
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 p-4 cursor-pointer rounded-2xl transition-all duration-300 ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    }`}
  >
    <Icon size={20} />
    <span className="font-bold text-sm">{label}</span>
  </div>
);
const Layout = ({ children }) => {
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
<aside className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col shadow-sm">
<div className="flex items-center gap-3 mb-12">
<div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
<Stethoscope size={26} />
</div>
<span className="text-2xl font-black text-slate-800 tracking-tight">MedPredict</span>
</div>
<nav className="flex-1 space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-4">
        {isMedecin ? "Portail Praticien" : "Espace Patient"}
      </p>
      
      {menuItems.map((item, idx) => (
        <SidebarItem
          key={idx}
          icon={item.icon}
          label={item.label}
          active={location.pathname === item.path}
          onClick={() => navigate(item.path)}
        />
      ))}
    </nav>

    <div className="mt-auto pt-8 border-t border-slate-100">
      <button 
        onClick={() => { logout(); navigate('/'); }}
        className="flex items-center gap-3 w-full p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
      >
        <LogOut size={20} /> Déconnexion
      </button>
    </div>
  </aside>

  {/* Main Content */}
  <div className="flex-1 flex flex-col overflow-hidden">
    <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shadow-sm z-10">
      <div className="font-bold text-lg text-slate-700">
         Bonjour, Dr. <span className="text-blue-600">{user?.username}</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-sm leading-none text-slate-800">{user?.username}</p>
            <p className="text-[10px] font-black uppercase text-blue-600 mt-1">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>

    <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
      {children}
    </main>
  </div>
</div>
);
};
export default Layout;