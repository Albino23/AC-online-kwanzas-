import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';

export const ChangePasswordModal: React.FC = () => {
  const {
    changePasswordModalOpen,
    setChangePasswordModalOpen,
    changePassword,
    isPasswordRecovery,
    setIsPasswordRecovery,
    recoveryEmail,
    confirmPasswordReset,
  } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!changePasswordModalOpen) return null;

  const handleClose = () => {
    setChangePasswordModalOpen(false);
    setIsPasswordRecovery(false);
    setError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordRecovery && !currentPassword) {
      setError('Por favor introduza a sua palavra-passe atual.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação da nova palavra-passe não coincide.');
      return;
    }

    setLoading(true);

    if (isPasswordRecovery) {
      // Fluxo de recuperação via link seguro de e-mail (sem requerer palavra-passe antiga)
      const res = await confirmPasswordReset(newPassword);
      setLoading(false);
      if (res.success) {
        handleClose();
      } else {
        setError(res.error || 'Erro ao redefinir a palavra-passe.');
      }
    } else {
      // Fluxo de alteração de palavra-passe com utilizador autenticado
      const res = await changePassword(currentPassword, newPassword);
      setLoading(false);
      if (res.success) {
        handleClose();
      } else {
        setError(res.error || 'Erro ao alterar a palavra-passe.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base font-display">
                {isPasswordRecovery ? 'Redefinir Palavra-passe' : 'Alterar Palavra-passe'}
              </h3>
              {isPasswordRecovery && recoveryEmail && (
                <p className="text-[11px] text-slate-300">
                  Conta: <strong>{recoveryEmail}</strong>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isPasswordRecovery && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Ligação de recuperação validada com sucesso. Introduza a sua nova palavra-passe de acesso.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isPasswordRecovery && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Palavra-passe Atual
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nova Palavra-passe
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmar Nova Palavra-passe
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova palavra-passe"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading
                ? 'A gravar...'
                : isPasswordRecovery
                ? 'Guardar Nova Palavra-passe e Entrar'
                : 'Salvar Nova Palavra-passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
