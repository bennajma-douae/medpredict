import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, ClipboardList, 
  LogOut, Bell, Search, Stethoscope 
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-300 ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
      : 'text-slate-500 hover:bg-white/5 hover:text-blue-400'
    }`}
  >
    <Icon size={20} />
    <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
  </div>
);

const Layout = ({ children }) => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 overflow-hidden">
      {/* GLOWS D'ARRIÈRE-PLAN */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* SIDEBAR */}
      <aside className="w-72 glass border-r border-white/5 p-6 flex flex-col z-10">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/40">
            <Stethoscope size={22} />
          </div>
          <span className="text-xl font-black text-white italic tracking-tighter uppercase">MedPredict</span>
        </div>

        <nav className="flex-1 space-y-3">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={Users} label="Patients" active={location.pathname === '/patients'} onClick={() => navigate('/patients')} />
          <SidebarItem icon={Calendar} label="Rendez-vous" active={location.pathname === '/appointments'} />
          <SidebarItem icon={ClipboardList} label="Consultations" active={location.pathname === '/consultations'} />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 w-full p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-20 glass border-b border-white/5 flex items-center justify-between px-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Rechercher..." className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-sm focus:border-blue-500/50 outline-none transition-all" />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-blue-400 transition">
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-black text-white tracking-tight">Dr. Ahmed Alami</p>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Médecin Directeur</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center text-white font-black">AA</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;