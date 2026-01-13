
import React, { useState } from 'react';
import { TeamMember, AISuggestion, User } from '../types';
import { getTeamStructureSuggestions } from '../services/geminiService';

interface SidebarProps {
  onAddMember: () => void;
  onImportAI: (suggestions: AISuggestion[]) => void;
  onOpenHistory: () => void;
  onOpenUserManagement: () => void;
  onLogout: () => void;
  isEditing: boolean;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddMember, onImportAI, onOpenHistory, onOpenUserManagement, onLogout, isEditing, user }) => {
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState('Manufatura');
  const [size, setSize] = useState('Média');

  const handleAISuggestions = async () => {
    setLoading(true);
    try {
      const result = await getTeamStructureSuggestions(size, industry, 'Qualidade ISO 9001 e Six Sigma');
      onImportAI(result);
    } catch (error) {
      alert("Erro ao buscar sugestões da IA.");
    } finally {
      setLoading(false);
    }
  };

  const canManageUsers = user.role === 'Admin' || user.role === 'Gerente';

  return (
    <aside className="w-80 border-r bg-white h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
      <div className="mb-12 flex items-center gap-4">
        <div className={`w-10 h-10 ${!isEditing ? 'bg-orange-500' : 'bg-slate-800'} rounded-xl flex items-center justify-center text-white shadow-lg transition-colors`}>
          <i className="fa-solid fa-users-viewfinder text-xl"></i>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800 leading-none tracking-tight">
            QualityOps
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-[0.2em]">v2.0 Beta</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <button 
          onClick={onAddMember}
          disabled={!isEditing}
          className={`w-full font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 uppercase text-[11px] tracking-widest ${
            isEditing 
            ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-900/10' 
            : 'bg-slate-50 text-slate-300 cursor-not-allowed border-2 border-slate-100 shadow-none'
          }`}
        >
          <i className="fa-solid fa-user-plus"></i>
          Novo Integrante
        </button>

        <button 
          onClick={onOpenHistory}
          className={`w-full bg-white border-2 ${!isEditing ? 'border-orange-100 hover:border-orange-500/30' : 'border-slate-50 hover:border-slate-300'} text-slate-600 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all group uppercase text-[11px] tracking-widest`}
        >
          <i className={`fa-solid fa-clock-rotate-left ${!isEditing ? 'group-hover:text-orange-500' : 'group-hover:text-slate-900'} transition-colors`}></i>
          Histórico
        </button>

        {canManageUsers && (
          <button 
            onClick={onOpenUserManagement}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase text-[11px] tracking-widest border border-slate-200"
          >
            <i className="fa-solid fa-users-gear"></i>
            Gestão de Usuários
          </button>
        )}

        <div className={`pt-10 border-t mt-6 transition-opacity duration-300 ${!isEditing ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <i className="fa-solid fa-sparkles"></i>
            </div>
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">Assistente IA</h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Indústria</label>
              <select 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border-2 border-slate-50 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none bg-slate-50"
              >
                <option>Manufatura</option>
                <option>Software / SaaS</option>
                <option>Farmacêutico</option>
                <option>Automotivo</option>
                <option>Alimentício</option>
              </select>
            </div>

            <button
              onClick={handleAISuggestions}
              disabled={loading || !isEditing}
              className={`w-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase text-[10px] tracking-widest ${loading ? 'opacity-50' : 'active:scale-95 shadow-lg shadow-indigo-500/10'}`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  Analisando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-microchip"></i>
                  Sugerir Estrutura
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-10 border-t mt-auto space-y-4">
        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
              <i className="fa-solid fa-circle-user text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{user.name}</span>
              <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{user.role}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Encerrar Sessão
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
