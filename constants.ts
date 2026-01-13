
import { TeamMember } from './types';

export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'paulo-h',
    name: 'Paulo H. H. Cardoso',
    role: 'Gerente de Qualidade',
    email: 'paulo.cardoso@viemar.com.br',
    department: 'Gerência de Qualidade',
    parentId: null,
  },
  {
    id: 'christian',
    name: 'Christian Hubert',
    role: 'Coordenador de Engenharia de Qualidade',
    email: 'christian.hubert@viemar.com.br',
    department: 'Engenharia de Qualidade',
    parentId: 'paulo-h',
    focus: ['Gestão de Qualidade', 'Melhoria Contínua', 'Normas ISO']
  },
  {
    id: 'maicon',
    name: 'Maicon Lemos',
    role: 'Coordenador de Processo U/M',
    email: 'maicon.lemos@viemar.com.br',
    department: 'Usinagem',
    parentId: 'paulo-h',
    focus: ['Processos de Usinagem', 'Montagem', 'Eficiência Produtiva']
  },
  {
    id: 'tiago',
    name: 'Tiago Chalinski',
    role: 'Coordenador de Processo C/E',
    email: 'tiago.chalinski@viemar.com.br',
    department: 'Conformação',
    parentId: 'paulo-h',
    focus: ['Conformação Mecânica', 'Elastômeros', 'Qualidade de Processo']
  },
  // --- SUB-EQUIPE CHRISTIAN HUBERT ---
  {
    id: 'paulo-f',
    name: 'Paulo Frost',
    role: 'Analista de Qualidade',
    email: 'paulo.frost@viemar.com.br',
    department: 'Engenharia de Qualidade',
    parentId: 'christian',
    focus: ['Acompanhar processos e produtos para identificar desvios', 'Acompanhamento de fornecedores']
  },
  {
    id: 'alexandre-b',
    name: 'Alexandre Barbosa',
    role: 'Inspetor',
    email: 'alexandre.barbosa@viemar.com.br',
    department: 'Engenharia de Qualidade',
    parentId: 'paulo-f',
    focus: ['Inspeção dimensional', 'Desenvolvimento de ferramentas', 'Melhoria contínua']
  },
  {
    id: 'vagner-m',
    name: 'Vagner Miranda',
    role: 'Analista de Qualidade',
    email: 'vagner.miranda@viemar.com.br',
    department: 'Inovação',
    parentId: 'christian',
    focus: ['Indicadores', 'Projetos de automação', 'Desenvolvimento distribuído e inovação']
  },
  {
    id: 'diereson-d',
    name: 'Diéreson Duarte',
    role: 'Técnico Qualidade',
    email: 'diereson.duarte@viemar.com.br',
    department: 'Desenvolvimento',
    parentId: 'vagner-m',
    focus: ['Desenvolvimento', 'Desenvolvimentos de ferramentas', 'Melhoria contínua']
  },
  {
    id: 'marcelo-m',
    name: 'Marcelo S. Machado',
    role: 'Analista de Qualidade',
    email: 'marcelo.machado@viemar.com.br',
    department: 'Engenharia de Qualidade',
    parentId: 'christian',
    focus: ['Inovações/montagem', 'Redução de custos', 'Melhoria contínua']
  },
  {
    id: 'deivid-m',
    name: 'Deivid Meirelles',
    role: 'Técnico Inspetor SAC/Garantia',
    email: 'deivid.meirelles@viemar.com.br',
    department: 'SAC/Garantia',
    parentId: 'marcelo-m',
    focus: ['Atendimento ao cliente', 'Melhoria contínua', 'Conhecimento técnico de produto e processo']
  },
  {
    id: 'ronaldo',
    name: 'Ronaldo Adriano',
    role: 'Analista de Qualidade',
    email: 'ronaldo@viemar.com.br',
    department: 'Engenharia de Qualidade',
    parentId: 'christian',
    focus: ['Conformidade/Elastomero', 'Redução de custos', 'Melhoria contínua']
  },
  {
    id: 'jessica-b',
    name: 'Jessica Becker',
    role: 'Inspetor',
    email: 'jessica.becker@viemar.com.br',
    department: 'Recebimento',
    parentId: 'ronaldo',
    focus: ['Recebimento', 'Acompanhamento', 'Melhoria contínua']
  },
  {
    id: 'julio-l',
    name: 'Julio Lopes',
    role: 'Inspetor 2T',
    email: 'julio.lopes@viemar.com.br',
    department: 'Linha',
    parentId: 'jessica-b',
    focus: ['Atendimento problemas', 'Melhoria contínua', 'Conhecimento técnico de produto e processo']
  },
  {
    id: 'jonathan-k',
    name: 'Jonathan Klein',
    role: 'Inspetor 3T',
    email: 'jonathan.klein@viemar.com.br',
    department: 'Linha',
    parentId: 'jessica-b',
    focus: ['Atendimento problemas', 'Melhoria contínua', 'Conhecimento técnico de produto e processo']
  },
  {
    id: 'cristiano-s',
    name: 'Cristiano Silva',
    role: 'Técnico SAC/Garantia',
    email: 'cristiano.silva@viemar.com.br',
    department: 'SAC/Garantia',
    parentId: 'ronaldo',
    focus: ['Suporte aos analistas', 'Melhoria contínua', 'Conhecimento técnico de qualidade de Ferramentas']
  },
  {
    id: 'cluesa-s',
    name: 'Cluesa Santos',
    role: 'Inspetor',
    email: 'cluesa.santos@viemar.com.br',
    department: 'Recebimento',
    parentId: 'cristiano-s',
    focus: ['Recebimento e processos para identificar desvios', 'Atendimento reclamações de fornecedores']
  },
  {
    id: 'janaina-r',
    name: 'Janaina Ribeiro',
    role: 'Inspetor',
    email: 'janaina.ribeiro@viemar.com.br',
    department: 'Engenharia de Qualidade',
    parentId: 'cristiano-s',
    focus: ['Atendimento ao cliente', 'Inspecionar processos e produtos para identificar desvios', 'Atendimento reclamações de fornecedores']
  }
];

export const QUALITY_STANDARDS = [
  'ISO 9001:2015',
  'Six Sigma / Lean',
  'IATF 16949 (Automotivo)',
  'VDA 6.3'
];
