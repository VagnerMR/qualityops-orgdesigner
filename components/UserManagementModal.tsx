
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface UserManagementModalProps {
  onClose: () => void;
  onSave: (user: User) => void;
  existingUsers: User[];
  departments: string[];
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose, onSave, existingUsers, departments }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    email: '',
    role: 'Coordenador',
    departments: [],
    needsPasswordChange: true,
    password: '123456'
  });

  const [error, setError] = useState('');

  // Sincroniza o form se estiver editando
  useEffect(() => {
    if (editingUser) {
      setFormData({
        ...editingUser
      });
    } else {
      setFormData({
        name: '',
        username: '',
        email: '',
        role: 'Coordenador',
        departments: [],
        needsPasswordChange: true,
        password: '123456'
      });
    }
  }, [editingUser]);

  const toggleDepartment = (dept: string) => {
    const current = formData.departments || [];
    if (current.includes(dept)) {
      setFormData({ ...formData, departments: current.filter(d => d !== dept) });
    } else {
      setFormData({ ...formData, departments: [...current, dept] });
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setView('form');
  };

  const handleAddNewClick = () => {
    setEditingUser(null);
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || (formData.departments?.length === 0 && formData.role !== 'Admin')) {
      setError('Preencha todos os campos e selecione ao menos um departamento.');
      return;
    }

    // Se não estiver editando, checa se o username já existe
    if (!editingUser && existingUsers.some(u => u.username === formData.username?.toLowerCase())) {
      setError('Este nome de usuário já está em uso.');
      return;
    }

    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      username: formData.username!.toLowerCase(),
    } as User);
    
    setView('list');
    setEditingUser(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <i className={`fa-solid ${view === 'list' ? 'fa-users' : 'fa-user-pen'} text-xl`}></i>
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">
                {view === 'list' ? 'Usuários Cadastrados' : (editingUser ? 'Editar Usuário' : 'Novo Usuário')}
              </h3>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestão de Acesso</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {view === 'list' ? (
              <button 
                onClick={handleAddNewClick}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Adicionar Novo
              </button>
            ) : (
              <button 
                onClick={() => setView('list')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Ver Lista
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {view === 'list' ? (
            <div className="space-y-3">
              {existingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-xl transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{u.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{u.role}</span>
                        <span className="text-[10px] font-bold text-slate-400">{u.username}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Departamentos</p>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {u.departments.map(d => (
                          <span key={d} className="text-[8px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                            {d === '*' ? 'Todos' : d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-orange-500 hover:border-orange-100 transition-all shadow-sm"
                      title="Editar Usuário"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nome Completo</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-slate-800 transition-all font-bold text-slate-800"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Usuário de Login</label>
                    <input
                      required
                      disabled={!!editingUser}
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-800 ${editingUser ? 'opacity-50' : 'focus:border-slate-800'}`}
                      placeholder="usuario.login"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Senha do Usuário</label>
                    <input
                      required
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-slate-800 transition-all font-bold text-slate-800"
                      placeholder="Senha do sistema"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">E-mail</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-slate-800 transition-all font-bold text-slate-800"
                      placeholder="joao@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nível de Acesso</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-slate-800 transition-all appearance-none text-slate-800"
                    >
                      <option value="Gerente">Gerente</option>
                      <option value="Coordenador">Coordenador</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                {formData.role !== 'Admin' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Departamentos Responsáveis</label>
                    <div className="grid grid-cols-2 gap-2 mt-3 max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-3xl border border-slate-100">
                      {departments.map(dept => (
                        <label key={dept} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="peer hidden"
                            checked={formData.departments?.includes(dept)}
                            onChange={() => toggleDepartment(dept)}
                          />
                          <div className="w-5 h-5 border-2 border-slate-200 rounded-lg peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-all flex items-center justify-center">
                            <i className="fa-solid fa-check text-white text-[8px]"></i>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase">{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 px-1">
                  <input 
                    type="checkbox" 
                    id="needsPass"
                    checked={formData.needsPasswordChange}
                    onChange={(e) => setFormData({...formData, needsPasswordChange: e.target.checked})}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
                  />
                  <label htmlFor="needsPass" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Exigir troca de senha no próximo login</label>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-500 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-[11px] transition-all shadow-2xl active:scale-95"
              >
                {editingUser ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
