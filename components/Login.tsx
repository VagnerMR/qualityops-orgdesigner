import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Usar o serviço de autenticação do Supabase
      const user = await authService.login(username, password);
      
      if (user) {
        // Verificar se precisa trocar senha (compatibilidade)
        const savedPasswords = JSON.parse(localStorage.getItem('qualityops_passwords') || '{}');
        const hasCustomPassword = !!savedPasswords[username];
        
        const finalUser = { 
          ...user, 
          needsPasswordChange: hasCustomPassword ? false : user.needsPasswordChange
        };
        
        onLogin(finalUser);
      } else {
        setError('Credenciais inválidas. Verifique usuário e senha.');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[48px] shadow-2xl p-12 border border-white/20">
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-orange-500 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-orange-500/20 mb-6">
              <i className="fa-solid fa-users-viewfinder text-3xl"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center leading-none">
              QualityOps<br/>
              <span className="text-orange-500 text-lg tracking-widest">OrgDesigner</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold text-center mt-4 px-6">
              {loading ? 'Conectando ao banco de dados...' : 'Use suas credenciais para acessar o sistema'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Usuário</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-orange-500 transition-all font-bold text-slate-800"
                  placeholder="Seu usuário"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Senha</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-orange-500 transition-all font-bold text-slate-800"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-500 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-shake">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-orange-500'} text-white font-black py-5 rounded-2xl uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 mt-8`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  Conectando...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center text-slate-400">
            <p className="text-[9px] font-black uppercase tracking-widest">Acesso Restrito</p>
            <p className="text-[8px] mt-1">Banco de dados: Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;