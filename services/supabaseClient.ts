import { createClient } from '@supabase/supabase-js'
import { User, TeamMember, HistoryRecord, AISuggestion } from '../types'

// SOLUÇÃO DE EMERGÊNCIA: Usar valores diretos se .env não carregar
const supabaseUrl = 
  import.meta.env?.VITE_SUPABASE_URL || 
  process.env?.VITE_SUPABASE_URL ||
  'https://vbcocdeppatirbvfmnfl.supabase.co'; // VALOR DIRETO

const supabaseKey = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  process.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiY29jZGVwcGF0aXJidmZtbmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTk2NjIsImV4cCI6MjA4MzM5NTY2Mn0.6t_qtIYdi0V3MLA96TRqofaR__reMbfDVgtDB5tSmgA'; // VALOR DIRETO

// Debug aprimorado
console.log('🔧 Supabase Config - Debug:');
console.log('   import.meta.env:', import.meta.env);
console.log('   process.env:', process.env);
console.log('   supabaseUrl final:', supabaseUrl ? '✓ ' + supabaseUrl.substring(0, 30) + '...' : '✗');
console.log('   supabaseKey final:', supabaseKey ? '✓ (primeiros 10): ' + supabaseKey.substring(0, 10) + '...' : '✗');



if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CREDENCIAIS SUPABASE NÃO ENCONTRADAS!');
  console.error('Verifique se .env.local contém:');
  console.error('   VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=sua-chave-anon');
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ===== FUNÇÕES ESPECÍFICAS QUALITYOPS =====

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      console.log('🔑 Tentando login para:', username);
    
      // Buscar pelo username (que agora é igual ao id)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('password', password)
        .maybeSingle();
    
      if (error) {
        console.error('❌ Erro no login:', error.message);
        return null;
      }
    
      if (!data) {
        console.log('❌ Usuário não encontrado ou senha incorreta');
        return null;
      }
    
      console.log('✅ Login bem-sucedido:', data.name);
    
      // Converter para formato da aplicação
      const user: User = {
        id: data.id,  // Agora será 'admin', 'paulo', etc.
        username: data.username,
        name: data.name,
        email: data.email || '',
        role: (data.role as UserRole) || 'Coordenador',
        departments: data.departments || [],
        needsPasswordChange: data.needs_password_change || true,
        password: data.password
      };
    
      console.log('👤 Usuário convertido:', user);
      return user;
    } catch (error) {
      console.error('❌ Exception no login:', error);
      return null;
    }
  },

  updatePassword: async (username: string, newPassword: string): Promise<boolean> => {
    try {
      console.log('🔐 Atualizando senha para:', username);
    
      const { error } = await supabase
        .from('users')
        .update({ 
          password: newPassword,
          needs_password_change: false,
          updated_at: new Date().toISOString()
        })
        .eq('username', username.toLowerCase());
    
      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        return false;
      }
    
      console.log('✅ Senha atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Exception ao atualizar senha:', error);
      return false;
    }
  }
};

export const teamService = {
  getAllMembers: async (): Promise<TeamMember[]> => {
    try {
      console.log('🔍 [DEBUG] Buscando todos os membros do Supabase...');
    
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('department');
    
      if (error) {
        console.error('❌ Erro ao buscar membros:', error);
        return [];
      }
    
      console.log(`✅ ${data?.length || 0} registros brutos do banco`);
    
      // DEBUG DETALHADO - Primeiros 5 registros
      if (data && data.length > 0) {
        console.log('📋 Dados brutos (amostra):');
        data.slice(0, 5).forEach((m, i) => {
          console.log(`  [${i}] ${m.id}: "${m.name}" → parent_id: ${m.parent_id} (${typeof m.parent_id})`);
        });
      }
    
      // CONVERSÃO CORRETA
      const convertedMembers: TeamMember[] = (data || []).map(member => {
        // IMPORTANTE: parentId deve ser string ou null
        let parentId: string | null = null;
      
        if (member.parent_id === null || member.parent_id === undefined) {
          parentId = null;
        } else if (member.parent_id === '') {
          parentId = null;
        } else {
          parentId = String(member.parent_id); // Converter para string
        }
      
        const converted: TeamMember = {
          id: member.id,
          name: member.name,
          role: member.role,
          email: member.email || '',
          department: member.department || '',
          parentId: parentId, // ← AQUI ESTÁ A CONVERSÃO
          photo: member.photo || '',
          focus: member.focus || [],
          status: member.status || 'active',
          created_at: member.created_at,
          updated_at: member.updated_at
        };
      
        return converted;
      });
    
      // DEBUG DA CONVERSÃO
      console.log('🔄 Membros convertidos (amostra):');
      convertedMembers.slice(0, 5).forEach((m, i) => {
        console.log(`  [${i}] ${m.id} → parentId: ${m.parentId} (${typeof m.parentId})`);
      });
    
      // Verificar paulo-h especificamente
      const pauloH = convertedMembers.find(m => m.id === 'paulo-h');
      console.log(`👑 Paulo H: parentId = ${pauloH?.parentId} (deve ser null)`);
    
      return convertedMembers;
    } catch (error) {
      console.error('❌ Exception ao buscar membros:', error);
      return [];
    }
  },

  saveMember: async (member: TeamMember): Promise<TeamMember | null> => {
    try {
      // Preparar dados para o banco
      const memberData = {
        id: member.id,
        name: member.name,
        role: member.role,
        email: member.email || '',
        department: member.department,
        parent_id: member.parentId,
        photo: member.photo || '',
        focus: member.focus || [],
        status: member.status || 'active',
        updated_at: new Date().toISOString()
      };

      // VERIFICAR: O membro já existe?
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('id', member.id)
        .maybeSingle();

      let result;
    
      if (existing) {
        // UPDATE se já existe
        result = await supabase
          .from('team_members')
          .update(memberData)
          .eq('id', member.id)
          .select()
          .single();
      } else {
        // INSERT se é novo
        result = await supabase
          .from('team_members')
          .insert([memberData])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erro ao salvar membro:', result.error);
        return null;
      }
    
      // Converter parent_id → parentId para a aplicação
      return {
        ...result.data,
        parentId: result.data.parent_id
      } as TeamMember;
    } catch (error) {
      console.error('Exception ao salvar membro:', error);
      return null;
    }
  },

  deleteMember: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Erro ao excluir membro:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Exception ao excluir membro:', error);
      return false;
    }
  }
};

export const historyService = {
  addRecord: async (record: Omit<HistoryRecord, 'id'>): Promise<boolean> => {
    try {
      const recordWithId = {
        ...record,
        id: Math.random().toString(36).substr(2, 9)
      };
      
      const { error } = await supabase
        .from('history_log')
        .insert([recordWithId])
      
      if (error) {
        console.error('Erro ao adicionar histórico:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Exception ao adicionar histórico:', error);
      return false;
    }
  },

  getHistory: async (limit = 50): Promise<HistoryRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('history_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }
      return data as HistoryRecord[];
    } catch (error) {
      console.error('Exception ao buscar histórico:', error);
      return [];
    }
  }
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
      }
      return data as User[];
    } catch (error) {
      console.error('Exception ao buscar usuários:', error);
      return [];
    }
  },

  saveUser: async (user: User): Promise<User | null> => {
    try {
      if (user.id) {
        // Update
        const { data, error } = await supabase
          .from('app_users')
          .update(user)
          .eq('id', user.id)
          .select()
          .single()
        
        if (error) {
          console.error('Erro ao atualizar usuário:', error);
          return null;
        }
        return data as User;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('app_users')
          .insert([user])
          .select()
          .single()
        
        if (error) {
          console.error('Erro ao criar usuário:', error);
          return null;
        }
        return data as User;
      }
    } catch (error) {
      console.error('Exception ao salvar usuário:', error);
      return null;
    }
  }
};

// Teste de conexão simplificado
export const testConnection = async () => {
  try {
    console.log('🔌 Testando conexão com Supabase...');
    
    const { data, error } = await supabase
      .from('app_users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro de conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return false;
  }
};

// ===== DEBUG: Expor serviços globalmente (apenas desenvolvimento) =====
if (import.meta.env.DEV) {
  // Expor no window para acesso pelo console
  (window as any).supabase = supabase;
  (window as any).authService = authService;
  (window as any).teamService = teamService;
  (window as any).userService = userService;
  (window as any).historyService = historyService;
  
  console.log('🔧 Serviços expostos globalmente (apenas dev):');
  console.log('   - window.supabase');
  console.log('   - window.authService');
  console.log('   - window.teamService');
  console.log('   - window.userService');
  console.log('   - window.historyService');
}

// Exportar o cliente direto se necessário
export default supabase;