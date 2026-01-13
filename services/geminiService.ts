export interface AISuggestion {
  role: string;
  description: string;
  responsibilities: string[];
  suggestedLevel: string;
}

// Dados mock para desenvolvimento
const mockSuggestions: AISuggestion[] = [
  {
    role: 'Analista de Qualidade Pleno',
    description: 'Responsável por análises estatísticas e relatórios de qualidade',
    responsibilities: ['Análise SPC', 'Relatórios de não conformidade', 'Auditorias internas'],
    suggestedLevel: 'Analista'
  },
  {
    role: 'Técnico em Metrologia',
    description: 'Especialista em calibração e medição dimensional',
    responsibilities: ['Calibração de equipamentos', 'Análise de capacidade', 'Controle metrológico'],
    suggestedLevel: 'Técnico'
  },
  {
    role: 'Coordenador de Sistemas da Qualidade',
    description: 'Coordena a implementação e manutenção do sistema de gestão da qualidade',
    responsibilities: ['Gestão documental', 'Auditorias de sistema', 'Indicadores de desempenho'],
    suggestedLevel: 'Coordenador'
  },
  {
    role: 'Inspetor de Qualidade',
    description: 'Realiza inspeções visuais e dimensionais em produtos',
    responsibilities: ['Inspeção final', 'Controle dimensional', 'Registro de não conformidades'],
    suggestedLevel: 'Inspetor'
  },
  {
    role: 'Gerente de Melhoria Contínua',
    description: 'Lidera projetos de melhoria e otimização de processos',
    responsibilities: ['Gestão de projetos', 'Análise de processos', 'Implementação de melhorias'],
    suggestedLevel: 'Gerente'
  }
];

export const getAISuggestions = async (prompt: string): Promise<AISuggestion[]> => {
  console.log('🤖 [MOCK] Gerando sugestões baseadas em:', prompt.substring(0, 100));
  
  // Simula um delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Retorna sugestões mock baseadas no prompt (filtra por palavras-chave)
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('técnico') || lowerPrompt.includes('metrologia')) {
    return mockSuggestions.filter(s => s.suggestedLevel === 'Técnico');
  }
  
  if (lowerPrompt.includes('analista') || lowerPrompt.includes('qualidade')) {
    return mockSuggestions.filter(s => s.suggestedLevel === 'Analista');
  }
  
  if (lowerPrompt.includes('coordenador') || lowerPrompt.includes('sistema')) {
    return mockSuggestions.filter(s => s.suggestedLevel === 'Coordenador');
  }
  
  // Retorna todas por padrão
  return [...mockSuggestions];
};

export const testAIConnection = async () => {
  return { 
    success: true, 
    message: 'Modo de desenvolvimento ativo - usando dados simulados' 
  };
};