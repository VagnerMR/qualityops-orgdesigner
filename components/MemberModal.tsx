
import React, { useState, useEffect, useRef } from 'react';
import { TeamMember } from '../types';

interface MemberModalProps {
  member: Partial<TeamMember> | null;
  allMembers: TeamMember[];
  onSave: (member: TeamMember) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isEditing: boolean;
}

const MemberModal: React.FC<MemberModalProps> = ({ member, allMembers, onSave, onDelete, onClose, isEditing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    email: '',
    department: '',
    parentId: null,
    focus: [],
    photo: '',
    ...member
  });

  const [focusText, setFocusText] = useState(formData.focus?.join('\n') || '');

  const roles = [
    'Gerente de Qualidade',
    'Coordenador de Qualidade',
    'Analista de Qualidade',
    'Técnico de Qualidade',
    'Inspetor de Qualidade'
  ];

  useEffect(() => {
    if (member) {
      setFormData(prev => ({ ...prev, ...member }));
      setFocusText(member.focus?.join('\n') || '');
    }
  }, [member]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.role) {
      onSave({
        ...formData,
        id: formData.id || Math.random().toString(36).substr(2, 9),
        focus: focusText.split('\n').filter(t => t.trim() !== ''),
      } as TeamMember);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        <div className={`${!isEditing ? 'bg-orange-500' : 'bg-slate-800'} p-10 text-white flex justify-between items-center transition-colors duration-500`}>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <i className="fa-solid fa-user-gear text-2xl"></i>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Dados do<br/>Integrante</h3>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
            <i className="fa-solid fa-times text-2xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-36 h-36 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {formData.photo ? (
                <img src={formData.photo} alt="Preview" className={`w-full h-full object-cover rounded-[48px] border-4 ${!isEditing ? 'border-orange-500' : 'border-slate-800'} shadow-2xl transition-colors`} />
              ) : (
                <div className={`w-full h-full bg-slate-50 border-4 border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center text-slate-300 group-hover:border-orange-500 group-hover:text-orange-500 transition-all`}>
                  <i className="fa-solid fa-camera text-4xl mb-3"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Enviar Foto</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-upload text-2xl"></i>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-${!isEditing ? 'orange-500' : 'slate-800'} transition-all font-bold text-slate-800`}
                  placeholder="Ex: Christian Hubert"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Cargo / Função</label>
                <div className="relative">
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-${!isEditing ? 'orange-500' : 'slate-800'} transition-all font-bold text-slate-800 appearance-none`}
                  >
                    <option value="" disabled>Selecione um cargo...</option>
                    {roles.map(r => (
                      <option key={r} value={r}>{r.split(' ')[0]}</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Reporta a</label>
                <div className="relative">
                  <select
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                    className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-${!isEditing ? 'orange-500' : 'slate-800'} transition-all appearance-none text-slate-800`}
                  >
                    <option value="">Nenhum (Topo)</option>
                    {allMembers
                      .filter(m => m.id !== formData.id)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))
                    }
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Departamento</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-${!isEditing ? 'orange-500' : 'slate-800'} transition-all font-bold text-slate-800`}
                  placeholder="Ex: Qualidade"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Foco / Atribuições (uma por linha)</label>
              <textarea
                value={focusText}
                onChange={(e) => setFocusText(e.target.value)}
                className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 h-40 text-sm font-bold outline-none focus:border-${!isEditing ? 'orange-500' : 'slate-800'} transition-all resize-none text-slate-800 custom-scrollbar`}
                placeholder="Ex: Melhoria contínua..."
              />
            </div>
          </div>

          <div className="flex gap-4 items-center pt-6">
            <button
              type="submit"
              className={`flex-1 ${!isEditing ? 'bg-slate-900 hover:bg-orange-500' : 'bg-slate-800 hover:bg-slate-700'} text-white font-black py-6 rounded-3xl uppercase tracking-widest text-[11px] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4`}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              Confirmar Dados
            </button>
            {formData.id && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(formData.id!)}
                className="px-8 h-20 bg-rose-50 border-2 border-rose-100 hover:bg-rose-500 hover:text-white text-rose-500 rounded-3xl transition-all flex items-center justify-center shadow-sm active:scale-95 text-[11px] font-black uppercase tracking-widest gap-3"
              >
                <i className="fa-solid fa-trash-can text-lg"></i>
                Excluir
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberModal;
