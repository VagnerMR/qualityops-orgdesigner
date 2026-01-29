import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import OrgChart, { OrgChartRef } from './components/OrgChart'; // ⬅ Esta importação precisa da NOVA interface
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
import './print.css';
import PrintAreaSelector from './components/PrintAreaSelector';
import { backgroundImage } from './backgroundImage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
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
  const [isPrintAreaSelecting, setIsPrintAreaSelecting] = useState(false);
  const [selectedPrintArea, setSelectedPrintArea] = useState<DOMRect | null>(null);

  // CORREÇÃO: Declare as refs primeiro, sem tentar usá-las
  const orgChartRef = useRef<OrgChartRef>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // CORREÇÃO: Remova estas linhas - você usará no momento certo
  // const svgInfo = orgChartRef.current?.getSVGElement(); // ⛔ REMOVER
  // const svgElement = svgInfo?.svgElement; // ⛔ REMOVER
  // const getCurrentTransform = svgInfo?.getCurrentTransform; // ⛔ REMOVER
  // const orgChartSVGRef = useRef<SVGSVGElement>(null); // ⛔ REMOVER (não é mais necessário)

  // FUNÇÃO AUXILIAR: Para obter o SVG quando necessário
  const getOrgChartSVG = () => {
    if (!orgChartRef.current) return null;
    const svgInfo = orgChartRef.current.getSVGElement();
    return svgInfo.svgElement;
  };

  // FUNÇÃO AUXILIAR: Para obter transformações quando necessário
  const getOrgChartTransform = () => {
    if (!orgChartRef.current) return { x: 0, y: 0, k: 1 };
    const svgInfo = orgChartRef.current.getSVGElement();
    return svgInfo.getCurrentTransform();
  };

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

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).currentUser = currentUser;
    }
  }, [currentUser]);

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

  // Nova função: verificar se membro está na subárvore do usuário
  const isInSubtree = (memberId: string, managerId: string, allMembers: TeamMember[]): boolean => {
    if (memberId === managerId) return true;

    let current = allMembers.find(m => m.id === memberId);
    let depth = 0;
    const maxDepth = 10; // Prevenir loop infinito

    while (current && current.parentId && depth < maxDepth) {
      if (current.parentId === managerId) return true;
      current = allMembers.find(m => m.id === current.parentId);
      depth++;
    }
    return false;
  };

  // Nova função: verificar permissões para editar membro
  const canEditMember = (member: TeamMember | null, currentUser: User): boolean => {
    if (!currentUser) return false;

    // 1. Admin pode tudo
    if (currentUser.role === 'Admin') return true;

    // 2. Usuários específicos (Paulo, Christian, Tiago, Maicon) podem editar sua sub-árvore completa
    const privilegedUsers = ['paulo', 'christian', 'tiago', 'maicon'];

    if (privilegedUsers.includes(currentUser.username.toLowerCase())) {
      // Se for adicionar novo membro
      if (!member) return true;

      // Verificar se o membro está na sub-árvore do usuário
      return isInSubtree(member.id, currentUser.id, members);
    }

    // 3. Gerente pode editar todos do departamento
    if (currentUser.role === 'Gerente') {
      if (!member) return true; // Adicionar novo
      return currentUser.departments.includes('*') ||
        currentUser.departments.includes(member.department);
    }

    // 4. Coordenador só pode editar sua sub-árvore
    if (currentUser.role === 'Coordenador') {
      if (!member) return true; // Pode adicionar subordinados
      return isInSubtree(member.id, currentUser.id, members);
    }

    // 5. Outros usuários não podem editar
    return false;
  };

  if (import.meta.env.DEV) {
    (window as any).canEditMember = canEditMember;
    (window as any).isInSubtree = isInSubtree;
    // currentUser será atualizado quando mudar
  }

  // Filtragem dos membros baseada no usuário logado e no nível de visualização
  const filteredMembers = useMemo(() => {
    if (!currentUser) return [];

    // 1. Filtragem por Nível de Visualização
    let visibleByLevel = members.filter(m => getRoleLevel(m.role) <= maxVisibleLevel);

    // 2. Se for usuário privilegiado, mostra toda sua sub-árvore
    const privilegedUsers = ['paulo', 'christian', 'tiago', 'maicon'];

    if (privilegedUsers.includes(currentUser.username.toLowerCase())) {
      const getUserSubtree = (userId: string): TeamMember[] => {
        const result = new Set<string>();

        const collectSubordinates = (managerId: string) => {
          result.add(managerId);

          const directSubordinates = visibleByLevel.filter(m => m.parentId === managerId);
          directSubordinates.forEach(sub => {
            collectSubordinates(sub.id);
          });
        };

        collectSubordinates(currentUser.id);
        return visibleByLevel.filter(m => result.has(m.id));
      };

      return getUserSubtree(currentUser.id);
    }

    // 3. Resto da lógica original para outros tipos de usuário
    if (currentUser.role === 'Admin') {
      return visibleByLevel;
    }

    if (currentUser.role === 'Gerente') {
      if (currentUser.departments.includes('*')) {
        return visibleByLevel;
      }
      return visibleByLevel.filter(m =>
        currentUser.departments.includes(m.department)
      );
    }

    if (currentUser.role === 'Coordenador') {
      const getUserSubtree = (userId: string): TeamMember[] => {
        const result = new Set<string>();

        const collectSubordinates = (managerId: string) => {
          result.add(managerId);
          const directSubordinates = visibleByLevel.filter(m => m.parentId === managerId);
          directSubordinates.forEach(sub => {
            collectSubordinates(sub.id);
          });
        };

        collectSubordinates(userId);
        return visibleByLevel.filter(m => result.has(m.id));
      };

      return getUserSubtree(currentUser.id);
    }

    // Para outros roles - ver apenas si mesmo
    return visibleByLevel.filter(m => m.id === currentUser.id);
  }, [members, currentUser, maxVisibleLevel]);

  // Função auxiliar: coletar todos os IDs de uma sub-árvore
  const getSubtreeIds = (rootId: string, allMembers: TeamMember[]): Set<string> => {
    const ids = new Set<string>();

    const traverse = (currentId: string) => {
      ids.add(currentId);

      // Encontrar filhos diretos
      const children = allMembers.filter(m => m.parentId === currentId);

      // Percorrer cada filho
      children.forEach(child => traverse(child.id));
    };

    traverse(rootId);
    return ids;
  };

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

    // Permite adicionar se for Admin, Gerente, Coordenador OU usuário privilegiado
    const canAdd = currentUser?.role === 'Admin' ||
      currentUser?.role === 'Gerente' ||
      currentUser?.role === 'Coordenador' ||
      ['paulo', 'christian', 'tiago', 'maicon'].includes(currentUser?.username?.toLowerCase() || '');

    if (!canAdd) {
      alert('Você não tem permissão para adicionar integrantes');
      return;
    }

    setModalMode('add');
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    if (!isEditing) return;
    if (!canEditMember(member, currentUser)) {
      alert('Você não tem permissão para editar este integrante');
      return;
    }
    setModalMode('edit');
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleAddSubordinate = (parentId: string) => {
    if (!isEditing) return;

    const parentMember = members.find(m => m.id === parentId);
    if (!parentMember) return;

    // Verifica se o usuário pode editar este membro pai
    if (!canEditMember(parentMember, currentUser)) {
      alert('Você não tem permissão para adicionar subordinados aqui');
      return;
    }

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
        newMembers = [...members, savedMember]; // ← AQUI: adiciona ao array
        await addHistoryRecord('Adição', `Adicionado integrante: ${savedMember.name}`);
      }

      setMembers(newMembers); // ← AQUI: atualiza o estado
      setIsModalOpen(false);

      // DEBUG: Verificar se atualizou
      console.log('🔄 Novo membro adicionado ao estado:', savedMember.name);
      console.log('   Total de membros agora:', newMembers.length);

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

  // ... imports e estados anteriores

  const handleExportPDF = () => {
    const svgElement = document.querySelector('#org-chart-container svg') as SVGSVGElement;
    if (!svgElement) return;

    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.style.backgroundColor = 'transparent';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QualityOps - Organograma</title>
          <style>
            @page { 
              size: landscape; 
              margin: 8mm 8mm 8mm 8mm; /* Margens aumentadas para dar mais espaço */
            }
            body { 
              margin: 0; 
              padding: 0;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              min-width: 100vw;
              background-color: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Container principal com borda e fundo */
            .print-container {
              box-sizing: border-box;
              width: 100%;
              height: 100%;
              border: 6px solid #f97316 !important; /* Borda um pouco mais fina */
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              padding: 20px; /* Mais espaço interno */
              
              /* Fundo com a imagem - REDUZIDA EM 0% (100% do tamanho original) */
              background-image: url('${backgroundImage}');
              background-size: 100% 100%; /* REDUZIDO EM 0% */
              background-position: center center;
              background-repeat: no-repeat;
              background-origin: padding-box; /* Mantém dentro do padding */
            }
            /* Container para escalar o organograma */
            .chart-container {
              width: 95%; /* Também reduzido 5% */
              height: 95%; /* Também reduzido 5% */
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: transparent;
            }
            svg { 
              width: 100%;
              height: 100%;
              max-width: 100%;
              max-height: 100%;
              display: block;
              background-color: transparent !important;
            }
            @media print {
              .print-container {
                /* Garantir borda laranja na impressão */
                border: 8px solid #f97316 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="chart-container">
              ${clonedSvg.outerHTML}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  /**
   * Lógica Principal de Impressão Vetorial
   * Recebe as coordenadas (bbox) já ajustadas para o tamanho real do SVG
   */

  const handlePrintAreaSelected = (bbox: DOMRect) => {
    setIsPrintAreaSelecting(false);

    const originalSvg = document.querySelector('#org-chart-container svg') as SVGSVGElement;
    if (!originalSvg) return;

    // CLONAR o SVG MAS REMOVER AS TRANSFORMAÇÕES DO D3
    const clonedSvg = originalSvg.cloneNode(true) as SVGSVGElement;

    // ENCONTRAR O GRUPO PRINCIPAL (que contém as transformações do D3)
    const mainGroup = clonedSvg.querySelector('g');
    if (mainGroup) {
      // RESETAR as transformações para evitar deslocamento
      mainGroup.setAttribute('transform', '');

      // Aplicar APENAS o viewBox baseado na área selecionada
      // Isso garante que a imagem saia centralizada e correta
      clonedSvg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

      // Remover qualquer transformação inline
      clonedSvg.style.transform = '';
      clonedSvg.style.transformOrigin = '';
    }

    // Limpar estilos problemáticos
    clonedSvg.style.background = 'transparent';
    clonedSvg.style.width = '100%';
    clonedSvg.style.height = '100%';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QualityOps - Impressão</title>
          <style>
            @page { 
              size: landscape; 
              margin: 15mm 15mm 15mm 15mm;
            }
            body { 
              margin: 0; 
              padding: 0;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              width: 100vw;
              background-color: white;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-frame {
              border: 12px solid #f97316 !important;
              box-sizing: border-box;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background-color: white;
              background-image: url('${backgroundImage}');
              background-size: 95% 95%;
              background-position: center;
              background-repeat: no-repeat;
            }
            .chart-area {
              width: 95%;
              height: 95%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            svg {
              width: 100%;
              height: 100%;
              max-width: 100%;
              max-height: 100%;
              display: block;
            }
            @media print {
              .print-frame {
                border: 12px solid #f97316 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-frame">
            <div class="chart-area">
              ${clonedSvg.outerHTML}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 100);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOptimizeLayout = () => {
    orgChartRef.current?.resetLayout();
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);

    // ⬇⬇⬇ CORREÇÃO: Simplesmente salvar, a verificação será no render ⬇⬇⬇
    // O App.tsx JÁ TEM a verificação nas linhas 264-268
    localStorage.setItem('qualityops_session', JSON.stringify(user));

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

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).members = members;
      (window as any).maxVisibleLevel = maxVisibleLevel;
      (window as any).filteredMembers = filteredMembers;
      (window as any).availableDepartments = availableDepartments;
    }
  }, [members, maxVisibleLevel, filteredMembers, availableDepartments]);

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
                QualityOps
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

        <div className="flex-1 relative bg-[#f8fafc] print:bg-transparent">
          <OrgChart
            ref={orgChartRef}
            members={filteredMembers}
            onSelectMember={handleEditMember}
            onAddSubordinate={handleAddSubordinate}
            onDeleteMember={handleDeleteMember}
            isEditing={isEditing}
          />

          {/* FIM DA INSERÇÃO */}

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
          currentUser={currentUser}
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

      {isPrintAreaSelecting && (
        <PrintAreaSelector
          getSVGElement={getOrgChartSVG}
          getTransform={getOrgChartTransform}
          onAreaSelected={handlePrintAreaSelected}
          onCancel={() => setIsPrintAreaSelecting(false)}
        />
      )}
    </div>
  );
};

export default App;