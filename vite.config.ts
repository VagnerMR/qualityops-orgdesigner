import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega TODAS as variáveis de ambiente do .env.local
  const env = loadEnv(mode, process.cwd(), '');
  
  // Debug: mostrar variáveis carregadas
  console.log('🔧 Vite Config - Variáveis carregadas:');
  console.log('   VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? '✓' : '✗');
  console.log('   VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? '✓ (primeiros 10): ' + env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...' : '✗');
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Injeta TODAS as variáveis de ambiente
      'process.env': env,
      'import.meta.env': env,
      // Também define individualmente para garantir
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});