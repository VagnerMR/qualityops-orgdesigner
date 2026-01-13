import { supabase, testConnection } from './services/supabaseClient';

export const TestConnection = () => {
  const handleTest = async () => {
    console.clear();
    console.log('🚀 Iniciando teste completo do QualityOps...');
    
    // Teste 1: Conexão básica
    console.log('\n1. Testando conexão com Supabase...');
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      console.error('❌ Conexão falhou. Verifique:');
      console.error('   - Variáveis de ambiente (.env.local)');
      console.error('   - URL do Supabase');
      console.error('   - Chave anônima');
      return;
    }
    
    // Teste 2: Tabelas
    console.log('\n2. Verificando tabelas...');
    const tables = ['users', 'team_members', 'history_log', 'ai_suggestions'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`   ❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ Tabela ${table}: ${count} registros`);
      }
    }
    
    // Teste 3: Dados de usuários
    console.log('\n3. Testando dados de usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error(`   ❌ Erro ao buscar usuários: ${usersError.message}`);
    } else {
      console.log(`   ✅ ${users?.length || 0} usuários encontrados`);
      
      // Verificar usuários padrão
      const defaultUsers = ['admin', 'paulo', 'christian', 'maicon', 'tiago'];
      const foundUsers = users?.filter(u => defaultUsers.includes(u.username)) || [];
      console.log(`   ✅ ${foundUsers.length}/${defaultUsers.length} usuários padrão carregados`);
      
      if (foundUsers.length < defaultUsers.length) {
        console.warn('   ⚠️  Alguns usuários padrão não foram encontrados');
      }
    }
    
    // Teste 4: Dados de membros
    console.log('\n4. Testando dados da equipe...');
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*');
    
    if (membersError) {
      console.error(`   ❌ Erro ao buscar membros: ${membersError.message}`);
    } else {
      console.log(`   ✅ ${members?.length || 0} membros encontrados`);
      
      // Verificar membros iniciais
      const initialMembers = ['paulo-h', 'christian', 'maicon', 'tiago'];
      const foundMembers = members?.filter(m => initialMembers.includes(m.id)) || [];
      console.log(`   ✅ ${foundMembers.length}/${initialMembers.length} membros iniciais carregados`);
    }
    
    // Teste 5: Login de teste
    console.log('\n5. Testando autenticação...');
    const { data: testUser, error: loginError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .eq('password', 'admin')
      .single();
    
    if (loginError || !testUser) {
      console.error(`   ❌ Login teste falhou: ${loginError?.message || 'Usuário não encontrado'}`);
    } else {
      console.log(`   ✅ Login bem-sucedido: ${testUser.name} (${testUser.role})`);
    }
    
    console.log('\n🎉 Teste completo!');
    console.log('📋 Resumo:');
    console.log(`   - Conexão: ${connectionOk ? '✅ OK' : '❌ Falhou'}`);
    console.log(`   - Usuários: ${users?.length || 0}`);
    console.log(`   - Membros: ${members?.length || 0}`);
    console.log(`   - Tabelas: 4/4 verificadas`);
    
    if (connectionOk && (users?.length || 0) > 0 && (members?.length || 0) > 0) {
      console.log('\n✨ Sistema pronto para uso!');
      alert('✅ Teste concluído com sucesso! Veja os detalhes no console.');
    } else {
      console.error('\n⚠️  Problemas detectados. Verifique os logs acima.');
      alert('⚠️  Alguns problemas foram detectados. Verifique o console.');
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-50">
      <button
        onClick={handleTest}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"
        title="Testar conexão com Supabase"
      >
        <i className="fa-solid fa-plug"></i>
        Testar Conexão
      </button>
    </div>
  );
};

// Componente para adicionar ao App (opcional)
export const ConnectionTester = () => {
  const [showTester, setShowTester] = useState(false);
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <>
        <button
          onClick={() => setShowTester(!showTester)}
          className="fixed bottom-10 right-10 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center z-50"
        >
          <i className="fa-solid fa-bug"></i>
        </button>
        {showTester && <TestConnection />}
      </>
    );
  }
  
  return null;
};