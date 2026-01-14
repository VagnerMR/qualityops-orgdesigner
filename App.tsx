import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import OrgChart, { OrgChartRef } from './components/OrgChart';
import MemberModal from './components/MemberModal';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import UserManagementModal from './components/UserManagementModal';
import { TeamMember, AISuggestion, HistoryRecord, User } from './types';
import {
  authService,
  teamService,
  historyService,
  userService
} from './services/supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]); // VAZIO inicialmente
  const [users, setUsers] = useState<User[]>([]);
  const [lastSavedMembers, setLastSavedMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [maxVisibleLevel, setMaxVisibleLevel] = useState<number>(5);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const orgChartRef = useRef<OrgChartRef>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Departamentos únicos para o cadastro
  const availableDepartments = useMemo(() => {
    return Array.from(new Set(members.map(m => m.department))).sort();
  }, [members]);

  // Mescla usuários padrão com usuários customizados/editados
  const allSystemUsers = useMemo(() => {
    const defaultUsersFromDB = users.filter(u =>
      ['admin', 'paulo', 'christian', 'maicon', 'tiago'].includes(u.username)
    );
    const customUsers = users.filter(u =>
      !['admin', 'paulo', 'christian', 'maicon', 'tiago'].includes(u.username)
    );
    return [...defaultUsersFromDB, ...customUsers];
  }, [users]);

  // Função auxiliar para determinar o nível com base no cargo
  const getRoleLevel = (role: string): number => {
    const r = role.toLowerCase();
    if (r.includes('gerente')) return 0;
    if (r.includes('coordenador')) return 1;
    if (r.includes('analista')) return 2;
    if (r.includes('técnico') || r.includes('tecnico') || r.includes('tec ')) return 3; // ↑ Acima dos inspetores
    if (r.includes('inspetor') || r.includes('atendente')) return 4; // ↓ Abaixo dos técnicos
    return 5;
  };

  // Filtragem dos membros baseada no usuário logado e no nível de visualização
  const filteredMembers = useMemo(() => {
    if (!currentUser) return [];

    // 1. Filtragem por Nível de Visualização
    let visibleByLevel = members.filter(m => getRoleLevel(m.role) <= maxVisibleLevel);

    // 2. Filtragem por Departamento (Acesso do Usuário)
    if (currentUser.role === 'Admin' || currentUser.departments.includes('*')) {
      return visibleByLevel;
    }

    // Para usuários com departamentos restritos
    const targetDepartmentMembers = visibleByLevel.filter(m =>
      currentUser.departments.includes(m.department)
    );

    const finalSet = new Set<string>();
    targetDepartmentMembers.forEach(m => finalSet.add(m.id));

    // Função para coletar todos os pais de forma recursiva
    const addAncestors = (memberId: string | null) => {
      if (!memberId) return;
      const member = members.find(m => m.id === memberId);
      if (member) {
        finalSet.add(member.id);
        if (member.parentId) {
          addAncestors(member.parentId);
        }
      }
    };

    targetDepartmentMembers.forEach(m => {
      if (m.parentId) {
        addAncestors(m.parentId);
      }
    });

    return members.filter(m => finalSet.has(m.id));
  }, [members, currentUser, maxVisibleLevel]);

  // CARREGAR DADOS DO SUPABASE
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // 1. Verificar sessão local (para login automático)
        const savedSession = localStorage.getItem('qualityops_session');
        if (savedSession) {
          try {
            const user = JSON.parse(savedSession);
            // Verificar se o usuário ainda existe no banco
            const { data: userData } = await userService.getUsers();

            // CORREÇÃO: Verificar se userData existe e é array
            if (userData && Array.isArray(userData)) {
              const validUser = userData.find(u => u.id === user.id);
              if (validUser) {
                setCurrentUser(validUser);
              } else {
                localStorage.removeItem('qualityops_session');
              }
            }
          } catch (parseError) {
            console.error('Erro ao parsear sessão:', parseError);
            localStorage.removeItem('qualityops_session');
          }
        }

        // 2. Carregar membros da equipe
        const membersData = await teamService.getAllMembers();
        setMembers(membersData || []); // Garantir array
        setLastSavedMembers(membersData || []);

        // 3. Carregar usuários
        const usersData = await userService.getUsers();
        setUsers(usersData || []); // Garantir array

        // 4. Carregar histórico
        const historyData = await historyService.getHistory(50);
        if (historyData && Array.isArray(historyData)) {
          setHistory(historyData);
        }

        // 5. Carregar logo (do localStorage por enquanto)
        const savedLogo = localStorage.getItem('qualityops_logo');
        if (savedLogo) {
          setCompanyLogo(savedLogo);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Não mostrar alerta para evitar popups
        console.log('⚠️  Carregando dados iniciais do localStorage...');

        // Fallback para dados locais
        const savedMembers = localStorage.getItem('qualityops_members');
        if (savedMembers) {
          try {
            const parsed = JSON.parse(savedMembers);
            setMembers(parsed);
            setLastSavedMembers(parsed);
          } catch (e) {
            console.error('Erro ao carregar fallback:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addHistoryRecord = async (action: HistoryRecord['action'], details: string) => {
    const newRecord: Omit<HistoryRecord, 'id'> = {
      user_id: currentUser?.id,
      action_type: action,
      details,
      member_count: members.length,
      timestamp: new Date().toLocaleString('pt-BR')
    };

    const success = await historyService.addRecord(newRecord);
    if (success) {
      const historyData = await historyService.getHistory(50);
      setHistory(historyData);
    }
  };

  const startEditing = () => {
    setLastSavedMembers([...members]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (window.confirm("Deseja fechar o modo de edição? Todas as alterações não salvas serão descartadas.")) {
      setMembers([...lastSavedMembers]);
      setIsEditing(false);
    }
  };

  const handleSaveEdit = async () => {
    setLastSavedMembers([...members]);
    await addHistoryRecord('Edição', 'Alterações na estrutura organizacional salvas com sucesso');
    setIsEditing(false);
  };

  const handleAddMember = () => {
    if (!isEditing) return;
    setModalMode('add');
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    if (!isEditing) return;
    setModalMode('edit');
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleAddSubordinate = (parentId: string) => {
    if (!isEditing) return;
    setModalMode('add');
    setSelectedMember({ parentId } as any);
    setIsModalOpen(true);
  };

  const handleSaveMember = async (member: TeamMember) => {
    const savedMember = await teamService.saveMember(member);

    if (savedMember) {
      let newMembers;
      if (modalMode === 'edit') {
        newMembers = members.map(m => m.id === savedMember.id ? savedMember : m);
        await addHistoryRecord('Edição', `Atualizado integrante: ${savedMember.name}`);
      } else {
        newMembers = [...members, savedMember];
        await addHistoryRecord('Adição', `Adicionado integrante: ${savedMember.name}`);
      }

      setMembers(newMembers);
      setIsModalOpen(false);

      // Atualizar histórico local
      const historyData = await historyService.getHistory(50);
      setHistory(historyData);
    } else {
      alert('Erro ao salvar integrante. Tente novamente.');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!isEditing) return;
    const memberToDelete = members.find(m => m.id === id);
    if (!memberToDelete) return;

    if (window.confirm(`Remover ${memberToDelete.name}? Os subordinados diretos serão reatribuídos para o nível superior.`)) {
      const success = await teamService.deleteMember(id);

      if (success) {
        const parentId = memberToDelete.parentId;
        const newMembers = members
          .filter(m => m.id !== id)
          .map(m => m.parentId === id ? { ...m, parentId } : m);

        setMembers(newMembers);
        setIsModalOpen(false);

        await addHistoryRecord('Exclusão', `Removido integrante: ${memberToDelete.name}`);

        // Atualizar histórico local
        const historyData = await historyService.getHistory(50);
        setHistory(historyData);
      } else {
        alert('Erro ao excluir integrante. Tente novamente.');
      }
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleOptimizeLayout = () => {
    orgChartRef.current?.resetLayout();
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    if (!user.needsPasswordChange) {
      localStorage.setItem('qualityops_session', JSON.stringify(user));
    }

    // Registrar login no histórico
    await addHistoryRecord('Login', `Usuário ${user.name} fez login`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('qualityops_session');
    setIsEditing(false);
  };

  const handlePasswordChanged = async () => {
    if (currentUser) {
      const updatedUser = { ...currentUser, needsPasswordChange: false };
      setCurrentUser(updatedUser);
      localStorage.setItem('qualityops_session', JSON.stringify(updatedUser));

      // Atualizar usuário no banco
      await userService.saveUser(updatedUser);

      await addHistoryRecord('Troca de Senha', `Usuário ${currentUser.name} alterou a senha`);
    }
  };

  const handleSaveUser = async (newUser: User) => {
    const savedUser = await userService.saveUser(newUser);

    if (savedUser) {
      // Atualizar lista de usuários
      const usersData = await userService.getUsers();
      setUsers(usersData);

      const action = newUser.id ? 'Edição' : 'Cadastro Usuário';
      await addHistoryRecord(action, `Dados do usuário ${newUser.name} atualizados`);

      // Atualizar histórico local
      const historyData = await historyService.getHistory(50);
      setHistory(historyData);
    } else {
      alert('Erro ao salvar usuário. Tente novamente.');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser?.role !== 'Admin') return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCompanyLogo(base64);
        localStorage.setItem('qualityops_logo', base64);
        addHistoryRecord('Edição', 'Logo da empresa atualizada pelo administrador');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportAI = async (suggestions: AISuggestion[]) => {
    const newMembersFromAI = suggestions.map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      name: `VAGA: ${s.role}`,
      role: s.role,
      email: '',
      department: currentUser?.departments[0] === '*' ? 'Engenharia de Qualidade' : (currentUser?.departments[0] || 'Qualidade'),
      parent_id: filteredMembers[0]?.id || null,
      focus: s.responsibilities,
      status: 'contratacao'
    }));

    // Salvar todos os novos membros
    for (const member of newMembersFromAI) {
      await teamService.saveMember(member as TeamMember);
    }

    // Atualizar lista
    const updatedMembers = await teamService.getAllMembers();
    setMembers(updatedMembers);

    await addHistoryRecord('Importação IA', 'Novos papéis sugeridos pela inteligência artificial');
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-black text-white mb-2">QualityOps</h2>
          <p className="text-slate-400 text-sm">Carregando estrutura organizacional...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentUser.needsPasswordChange) {
    return <ChangePassword user={currentUser} onComplete={handlePasswordChanged} />;
  }

  return (
    <div className={`flex h-screen w-full bg-[#f8fafc] text-slate-900 font-sans print:h-auto overflow-hidden transition-all duration-500 ${isEditing ? 'border-[12px] border-slate-200' : 'border-[12px] border-orange-500'}`}>
      <div className="no-print h-full flex shrink-0">
        <Sidebar
          onAddMember={handleAddMember}
          onImportAI={handleImportAI}
          onOpenHistory={() => setShowHistory(true)}
          onOpenUserManagement={() => setIsUserModalOpen(true)}
          onLogout={handleLogout}
          isEditing={isEditing}
          user={currentUser}
        />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden print:overflow-visible">
        {isEditing && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-1.5 rounded-b-xl text-[10px] font-black uppercase tracking-widest z-[60] shadow-lg no-print">
            Modo de Edição Ativo
          </div>
        )}

        <header className="h-24 bg-white flex items-center justify-between px-12 z-20 border-b border-slate-100 no-print shadow-sm">
          <div className="flex items-center gap-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${!isEditing ? 'bg-orange-500 text-white shadow-orange-500/20 shadow-xl' : 'bg-slate-900 text-white shadow-xl'}`}>
              <i className={`fa-solid ${isEditing ? 'fa-wand-magic-sparkles' : 'fa-sitemap'} text-2xl`}></i>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {currentUser.role !== 'Admin' && currentUser.departments[0] !== '*' ? currentUser.departments.join(' & ') : 'Engenharia de Qualidade'}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">
                  {filteredMembers.length} Integrantes
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-user-shield text-[8px]"></i>
                  {currentUser.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group mr-2">
              <label className="absolute -top-6 left-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Níveis</label>
              <select
                value={maxVisibleLevel}
                onChange={(e) => setMaxVisibleLevel(parseInt(e.target.value))}
                className="bg-slate-50 border-2 border-slate-50 hover:border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tighter outline-none transition-all appearance-none pr-10 cursor-pointer text-slate-600 focus:border-orange-500"
              >
                <option value={5}>Visualizar: Todos</option>
                <option value={0}>Até Gerentes</option>
                <option value={1}>Até Coordenadores</option>
                <option value={2}>Até Analistas</option>
                <option value={3}>Até Técnicos</option>   {/* ANTES: Até Inspetores */}
                <option value={4}>Até Inspetores</option> {/* ANTES: Até Técnicos */}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
            </div>

            <button
              onClick={handleOptimizeLayout}
              title="Otimizar Layout"
              className="w-12 h-12 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all flex items-center justify-center active:scale-90"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </button>

            <button
              onClick={handleExportPDF}
              title="Exportar como PDF"
              className="w-12 h-12 bg-slate-50 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all flex items-center justify-center active:scale-90"
            >
              <i className="fa-solid fa-file-pdf"></i>
            </button>

            <div className="w-px h-8 bg-slate-100 mx-2"></div>

            {!isEditing ? (
              <button
                onClick={startEditing}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center gap-3 group"
              >
                <i className="fa-solid fa-pen-to-square group-hover:rotate-12 transition-transform"></i>
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelEdit}
                  title="Sair sem salvar"
                  className="w-14 h-14 bg-white border-2 border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-300 rounded-2xl transition-all flex items-center justify-center active:scale-90"
                >
                  <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all flex items-center gap-4 active:scale-95 group"
                >
                  <i className="fa-solid fa-floppy-disk group-hover:scale-110 transition-transform"></i>
                  SALVAR
                </button>
              </div>
            )}

            <div className="flex items-center border-l-2 pl-8 ml-4 border-slate-50">
              <div
                onClick={() => currentUser?.role === 'Admin' && logoInputRef.current?.click()}
                className={`w-10 h-10 border-2 border-orange-500 flex items-center justify-center rounded-2xl bg-white shadow-xl rotate-3 overflow-hidden transition-all ${currentUser?.role === 'Admin' ? 'cursor-pointer hover:scale-110 hover:rotate-0 group/logo' : ''}`}
                title={currentUser?.role === 'Admin' ? 'Clique para alterar a logo da empresa' : undefined}
              >
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo Empresa" className="w-full h-full object-contain p-1" />
                ) : (
                  <i className="fa-solid fa-v text-orange-500 text-2xl font-black"></i>
                )}
                {currentUser?.role === 'Admin' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                    <i className="fa-solid fa-camera text-white text-[10px]"></i>
                  </div>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 relative bg-[#f8fafc]">
          <OrgChart
            ref={orgChartRef}
            members={filteredMembers}
            onSelectMember={handleEditMember}
            onAddSubordinate={handleAddSubordinate}
            onDeleteMember={handleDeleteMember}
            isEditing={isEditing}
          />

          {showHistory && (
            <div className="absolute inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-40 border-l border-slate-100 flex flex-col animate-slide-in">
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                  <i className="fa-solid fa-history text-orange-500"></i>
                  Histórico
                </h3>
                <button onClick={() => setShowHistory(false)} className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50 custom-scrollbar">
                {history.map((record) => (
                  <div key={record.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full ${record.action_type === 'Adição' ? 'bg-emerald-50 text-emerald-600' :
                        record.action_type === 'Edição' ? 'bg-blue-50 text-blue-600' :
                          record.action_type === 'Cadastro Usuário' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                        {record.action_type}
                      </span>
                      <span className="text-[10px] text-slate-300 font-black tracking-widest">{record.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-bold leading-relaxed">{record.details}</p>
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{record.member_count} Integrantes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <MemberModal
          member={selectedMember}
          allMembers={filteredMembers}
          onSave={handleSaveMember}
          onDelete={handleDeleteMember}
          onClose={() => setIsModalOpen(false)}
          isEditing={isEditing}
        />
      )}

      {isUserModalOpen && (
        <UserManagementModal
          onClose={() => setIsUserModalOpen(false)}
          onSave={handleSaveUser}
          existingUsers={allSystemUsers}
          departments={availableDepartments}
        />
      )}
    </div>
  );
};

export default App;