import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/supabaseClient';

interface ChangePasswordProps {
  user: User;
  onComplete: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ user, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Atualizar senha no Supabase
      const success = await authService.updatePassword(user.username, newPassword);
      
      if (success) {
        // Manter compatibilidade com localStorage
        const savedPasswords = JSON.parse(localStorage.getItem('qualityops_passwords') || '{}');
        savedPasswords[user.username] = newPassword;
        localStorage.setItem('qualityops_passwords', JSON.stringify(savedPasswords));
        
        onComplete();
      } else {
        setError('Erro ao atualizar senha no servidor. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[48px] shadow-2xl p-12 border border-white/20">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-indigo-500 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 mb-6">
              <i className="fa-solid fa-key text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-center leading-tight">
              {loading ? 'Atualizando...' : 'Primeiro Acesso'}<br/>
              <span className="text-indigo-500 text-sm tracking-[0.2em]">Troca de Senha Obrigatória</span>
            </h2>
            <p className="text-slate-400 text-xs font-bold text-center mt-4 px-6">
              Olá <span className="text-slate-900">{user.name}</span>, por segurança, você deve definir uma nova senha.
            </p>
            <p className="text-[10px] text-slate-300 mt-2 font-bold">
              Banco de dados: Supabase
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Nova Senha</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800"
                placeholder="Mínimo 4 caracteres"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Confirmar Nova Senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800"
                placeholder="Repita a senha"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-500 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-black py-5 rounded-2xl uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95 mt-8 flex items-center justify-center gap-3`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;