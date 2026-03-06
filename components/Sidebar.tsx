
import React, { useState } from 'react';
import {
  Home,
  Droplets,
  Leaf,
  Users,
  HelpCircle,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Lock,
  LayoutDashboard,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AquaFeelLogo from './AquaFeelLogo';
import { Language } from '../utils/i18n';
import { useAuth } from '../contexts/AuthContext';

const MANAGER_EMAIL = 'binnovationmarketing@gmail.com';

interface SidebarProps {
  lang: Language;
  clientName: string;
  onNavigate: (sectionId: string) => void;
  onLogout: () => void;
  onOpenManager: () => void;
  onBackToDashboard?: () => void;
  currentSection: string;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  clientName,
  onNavigate,
  onLogout,
  onOpenManager,
  onBackToDashboard,
  currentSection,
  isCollapsed,
  setIsCollapsed
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();
  const isManager = user?.email === MANAGER_EMAIL;

  const menuItems = [
    { id: 'hero', label: lang === 'pt' ? 'Início' : lang === 'es' ? 'Inicio' : 'Home', icon: Home },
    { id: 'malefices', label: lang === 'pt' ? 'Riscos' : lang === 'es' ? 'Riesgos' : 'Risks', icon: ShieldCheck },
    { id: 'logic', label: lang === 'pt' ? 'Lógica' : lang === 'es' ? 'Lógica' : 'Logic', icon: Droplets },
    { id: 'soap', label: 'Pure Selects', icon: Leaf },
    { id: 'proposal', label: lang === 'pt' ? 'Proposta' : lang === 'es' ? 'Propuesta' : 'Proposal', icon: Zap },
    { id: 'testimonials', label: lang === 'pt' ? 'Famílias' : lang === 'es' ? 'Familias' : 'Families', icon: Users },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-[260px]';

  return (
    <>
      {/* Botão Mobile/iPad Portrait */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-[70] p-3 bg-slate-900/90 text-white rounded-xl backdrop-blur-md border border-white/10 lg:hidden shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Container da Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-[#020d1a] border-r border-white/5 z-[65]
        transition-all duration-300 ease-in-out ${sidebarWidth}
        flex flex-col shadow-2xl
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Toggle Button Desktop/iPad Landscape */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-aqua-600 rounded-full items-center justify-center text-white border border-white/20 shadow-lg z-[70] hover:bg-aqua-500 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Area */}
        <div className={`p-6 border-b border-white/5 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <div className="flex justify-center transition-all duration-300">
            {isCollapsed ? (
              <div className="w-10 h-10 bg-aqua-600/20 rounded-xl flex items-center justify-center text-aqua-400 border border-aqua-500/20">
                <Droplets size={20} />
              </div>
            ) : (
              <AquaFeelLogo width="140px" variant="white" />
            )}
          </div>
          {!isCollapsed && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 whitespace-nowrap">
              <Lock size={10} /> Ambiente Seguro
            </div>
          )}
        </div>

        {/* Client Info */}
        {!isCollapsed && (
          <div className="px-4 py-6">
            <div className="bg-gradient-to-br from-white/5 to-white/0 p-4 rounded-2xl border border-white/5">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">VIP Guest:</p>
              <p className="text-white font-bold truncate text-sm">{clientName}</p>
            </div>
          </div>
        )}

        {/* Menu Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileOpen(false);
              }}
              title={isCollapsed ? item.label : ''}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wide
                ${currentSection === item.id
                  ? 'bg-aqua-600/10 text-aqua-400 border border-aqua-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
            >
              <item.icon size={18} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className={`p-4 border-t border-white/5 space-y-2 bg-[#010810] ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              title={isCollapsed ? "Dashboard" : ""}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-aqua-400 hover:text-white hover:bg-aqua-600/20 border border-aqua-500/20 transition-all ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <LayoutDashboard size={16} />
              {!isCollapsed && <span>{lang === 'pt' ? 'Meu Dashboard' : lang === 'es' ? 'Mi Panel' : 'My Dashboard'}</span>}
            </button>
          )}
          {isManager && (
            <button
              onClick={onOpenManager}
              title={isCollapsed ? "Gestor" : ""}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <LayoutDashboard size={16} />
              {!isCollapsed && <span>Área do Gestor</span>}
            </button>
          )}

          <button
            onClick={onLogout}
            title={isCollapsed ? "Sair" : ""}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>{lang === 'pt' ? 'Sair' : lang === 'es' ? 'Salir' : 'Exit'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
