export type UserRole = 'Admin' | 'Gerente' | 'Coordenador';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  departments: string[];
  needsPasswordChange: boolean;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  parentId: string | null;
  parent_id?: string | null; // Para compatibilidade com banco
  photo?: string;
  focus?: string[];
  status?: 'default' | 'substituicao' | 'contratacao';
  created_at?: string;
  updated_at?: string;
}

export interface AISuggestion {
  role: string;
  description: string;
  responsibilities: string[];
  suggestedLevel: string;
}

// Interface para o banco (com nomes de campos reais)
export interface HistoryRecord {
  id: string;
  user_id: string;
  action_type: 'Adição' | 'Edição' | 'Exclusão' | 'Importação IA' | 'Login' | 'Cadastro Usuário' | 'Troca de Senha';
  details: string;
  member_count: number;
  timestamp: string;
  created_at?: string;
  
  // Aliases para compatibilidade com código antigo
  action?: 'Adição' | 'Edição' | 'Exclusão' | 'Importação IA' | 'Login' | 'Cadastro Usuário' | 'Troca de Senha';
  memberCount?: number;
}

// Interface auxiliar para conversão
export type HistoryInput = Omit<HistoryRecord, 'id'>;