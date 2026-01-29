import React, { useState, useEffect, useRef } from 'react';

// Mantenha SEUS imports originais
// import { TeamMember, AISuggestion, User } from '../types';
// import { getAISuggestions } from '../services/geminiService';

interface SidebarProps {
  onAddMember: () => void;
  onOpenHistory: () => void;
  onOpenUserManagement: () => void;
  onLogout: () => void;
  isEditing: boolean;
  user: any; // Mudei para any também
}

const Sidebar: React.FC<SidebarProps> = ({
  onAddMember,
  onOpenHistory,
  onOpenUserManagement,
  onLogout,
  isEditing,
  user
}) => {
  // SEU CÓDIGO ORIGINAL - mantido
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState('Manufatura');
  const [size, setSize] = useState('Média');

  // NOVO: estados para responsividade
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);


  // SEU CÓDIGO ORIGINAL - mantido
  const canManageUsers = user?.role === 'Admin' || user?.role === 'Gerente';

  // NOVO: comportamentos hover
  const handleMouseEnter = () => {
    if (!isMobile) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsHovered(true);
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        if (!isMobileOpen) {
          setIsCollapsed(true);
        }
      }, 300);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
    if (!isMobileOpen) {
      setIsCollapsed(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile &&
        isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileOpen]);

  // NOVO: Botão de menu para mobile
  if (isMobile && !isMobileOpen) {
    return (
      <button
        onClick={toggleMobileMenu}
        className="fixed left-4 top-4 z-50 p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        aria-label="Abrir menu"
        style={{ zIndex: 1000 }}
      >
        <i className="fa-solid fa-bars text-slate-800 text-lg"></i>
      </button>
    );
  }

  const isExpanded = isHovered || isMobileOpen || !isCollapsed;

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar principal - MODIFICADA para ser responsiva */}
      <aside
        ref={sidebarRef}
        className={`
          fixed md:relative
          h-full
          bg-white
          shadow-lg
          transition-all duration-300 ease-in-out
          border-r border-slate-100
          z-40
          ${isMobile ? 'w-80' : isExpanded ? 'w-80' : 'w-20'}
          ${isMobile && isMobileOpen ? 'left-0' : '-left-80 md:left-0'}
          ${isExpanded ? 'md:translate-x-0' : 'md:-translate-x-4'}
          flex flex-col
          overflow-y-auto custom-scrollbar
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Botão de toggle para desktop */}
        {!isMobile && (
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsHovered(!isCollapsed);
            }}
            className="absolute -right-3 top-6 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow z-50 border border-slate-200"
            aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
          >
            {isExpanded ? (
              <i className="fa-solid fa-chevron-left text-slate-600 text-xs"></i>
            ) : (
              <i className="fa-solid fa-chevron-right text-slate-600 text-xs"></i>
            )}
          </button>
        )}

        {/* Botão de fechar para mobile */}
        {isMobile && (
          <button
            onClick={toggleMobileMenu}
            className="absolute right-4 top-4 p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg"
            aria-label="Fechar menu"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        )}

        {/* SEU LOGO ORIGINAL - ajustado para responsivo */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${!isEditing ? 'bg-orange-500' : 'bg-slate-800'} rounded-xl flex items-center justify-center text-white shadow-lg transition-colors flex-shrink-0`}>
              <i className="fa-solid fa-users-viewfinder text-lg"></i>
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-800 leading-none tracking-tight whitespace-nowrap">
                  Viemar SmartOrg
                </h2>
                <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-[0.2em]">v2.0 Beta</p>
              </div>
            )}
            {!isExpanded && !isMobile && (
              <div className="text-center w-full">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">V2.0</p>
              </div>
            )}
          </div>
        </div>

        {/* SEUS BOTÕES ORIGINAIS - ajustados para responsivo */}
        <div className="space-y-4 flex-1 p-8">
          <button
            onClick={onAddMember}
            disabled={!isEditing}
            className={`
              w-full font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 uppercase text-[11px] tracking-widest
              ${isExpanded ? '' : 'px-2'}
              ${isEditing
                ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-900/10'
                : 'bg-slate-50 text-slate-300 cursor-not-allowed border-2 border-slate-100 shadow-none'
              }
            `}
            title={!isExpanded ? "Novo Integrante" : ""}
          >
            <i className="fa-solid fa-user-plus"></i>
            {isExpanded && "Novo Integrante"}
          </button>

          <button
            onClick={onOpenHistory}
            className={`
              w-full bg-white border-2 ${!isEditing ? 'border-orange-100 hover:border-orange-500/30' : 'border-slate-50 hover:border-slate-300'} 
              text-slate-600 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all group uppercase text-[11px] tracking-widest
              ${isExpanded ? '' : 'px-2'}
            `}
            title={!isExpanded ? "Histórico" : ""}
          >
            <i className={`fa-solid fa-clock-rotate-left ${!isEditing ? 'group-hover:text-orange-500' : 'group-hover:text-slate-900'} transition-colors`}></i>
            {isExpanded && "Histórico"}
          </button>

          {canManageUsers && (
            <button
              onClick={onOpenUserManagement}
              className={`
                w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 
                transition-all uppercase text-[11px] tracking-widest border border-slate-200
                ${isExpanded ? '' : 'px-2'}
              `}
              title={!isExpanded ? "Gestão de Usuários" : ""}
            >
              <i className="fa-solid fa-users-gear"></i>
              {isExpanded && "Gestão de Usuários"}
            </button>
          )}
        </div>

        {/* SEU USUÁRIO ORIGINAL - ajustado para responsivo */}
        <div className="pt-10 border-t border-slate-100 mt-auto p-8">
          <div className={`bg-slate-50 p-6 rounded-[24px] border border-slate-100 ${!isExpanded ? 'p-4' : ''}`}>
            <div className={`flex items-center ${isExpanded ? 'gap-4' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                <i className="fa-solid fa-circle-user text-xl"></i>
              </div>

              {isExpanded && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">
                    {user?.name || 'Usuário'}
                  </span>
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                    {user?.role || 'Usuário'}
                  </span>
                </div>
              )}

              {!isExpanded && !isMobile && (
                <div className="text-center">
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                    {user?.role?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className={`
                w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 
                text-slate-400 hover:text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 mt-4
                ${isExpanded ? '' : 'px-0'}
              `}
              title={!isExpanded ? "Sair" : ""}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              {isExpanded && "Encerrar Sessão"}
            </button>
          </div>
        </div>
      </aside>

      {/* Botão flutuante para desktop quando recolhido */}
      {!isMobile && isCollapsed && !isHovered && (
        <button
          onMouseEnter={handleMouseEnter}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-white rounded-r-xl shadow-md hover:shadow-lg transition-shadow border border-l-0 border-slate-200"
          onClick={() => {
            setIsCollapsed(false);
            setIsHovered(true);
          }}
          aria-label="Abrir menu"
          style={{ zIndex: 999 }}
        >
          <i className="fa-solid fa-chevron-right text-slate-600 text-sm"></i>
        </button>
      )}
    </>
  );
};

export default Sidebar;