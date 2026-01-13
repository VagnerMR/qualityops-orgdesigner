import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Anon Key must be defined in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Funções específicas para QualityOps
export const qualityOpsDB = {
  // Usuários
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')
    return { data, error }
  },
  
  // Team Members
  getTeamMembers: async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('department')
    return { data, error }
  },
  
  // Login
  loginUser: async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .single()
    return { data, error }
  },
  
  // Salvar membro
  saveTeamMember: async (member: any) => {
    if (member.id) {
      // Update
      const { data, error } = await supabase
        .from('team_members')
        .update(member)
        .eq('id', member.id)
      return { data, error }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('team_members')
        .insert([member])
      return { data, error }
    }
  },
  
  // Adicionar histórico
  addHistory: async (record: any) => {
    const { data, error } = await supabase
      .from('history_log')
      .insert([record])
    return { data, error }
  }
}