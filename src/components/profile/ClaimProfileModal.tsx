import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldAlert,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Store,
  FileText,
  Clock
} from 'lucide-react';

export const ClaimProfileModal: React.FC = () => {
  const {
    currentUser,
    userStore,
    claimProfileModalOpen,
    setClaimProfileModalOpen,
    submitProfileClaim,
    showToast,
  } = useApp();

  const [reason, setReason] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!claimProfileModalOpen || !currentUser) return null;

  const claimsUsed = currentUser.claimsCount || 0;
  const maxClaims = 5;
  const claimsRemaining = Math.max(0, maxClaims - claimsUsed);
  const isLimitReached = claimsUsed >= maxClaims;

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) {
      showToast('Limite vitalício de 5 reivindicações atingido.', 'error');
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      showToast('Por favor, descreva detalhadamente o motivo da correção (mínimo 10 caracteres).', 'error');
      return;
    }

    const fullReason = selectedFields.length > 0
      ? `[Campos a corrigir: ${selectedFields.join(', ')}] — ${reason.trim()}`
      : reason.trim();

    setLoading(true);
    const res = await submitProfileClaim(fullReason);
    setLoading(false);

    if (res.success) {
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setReason('');
        setSelectedFields([]);
        setClaimProfileModalOpen(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white relative shrink-0">
          <button
            onClick={() => setClaimProfileModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
              AC Online Kwanza • Moderação Cadastral
            </span>
          </div>

          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Reivindicar Correção dos Dados
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Cada conta tem permissão para editar o perfil livremente apenas 1 vez. Para novas retificações, envie o pedido à administração.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Claims Counter Badge */}
          <div className={`p-4 rounded-2xl border ${
            isLimitReached
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : claimsRemaining <= 2
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Limite Vitalício de Reivindicações
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white border border-slate-300 shadow-xs">
                {claimsUsed} / {maxClaims} Utilizadas
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  isLimitReached ? 'bg-rose-600' : 'bg-gradient-to-r from-amber-500 to-amber-700'
                }`}
                style={{ width: `${Math.min(100, (claimsUsed / maxClaims) * 100)}%` }}
              ></div>
            </div>

            <p className="text-xs leading-relaxed">
              {isLimitReached ? (
                <strong className="text-rose-700">
                  Atingiu o limite máximo de 5 reivindicações permitidas. Novos pedidos estão bloqueados. Contacte o administrador para assistência especial.
                </strong>
              ) : (
                <span>
                  Já utilizou <strong>{claimsUsed}</strong> de <strong>{maxClaims}</strong> reivindicações. Restam{' '}
                  <strong className="text-amber-700">{claimsRemaining}</strong> disponíveis.
                </span>
              )}
            </p>
          </div>

          {/* User & Store Identity Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-amber-600" />
                {currentUser.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                {currentUser.role === 'vendedor' ? 'Comerciante / Loja' : 'Cliente'}
              </span>
            </div>
            <p className="text-slate-500">{currentUser.email} • {currentUser.phone || 'Sem telefone'}</p>
            {userStore && (
              <p className="text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-200/60 mt-1">
                <Store className="w-3.5 h-3.5" />
                Loja Associada: <strong>{userStore.name}</strong> (NIF: {userStore.nif})
              </p>
            )}
          </div>

          {submittedSuccess ? (
            <div className="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="font-bold text-base font-display">Reivindicação Enviada com Sucesso!</h4>
              <p className="text-xs text-emerald-800">
                O seu pedido foi encaminhado para a área de <strong>Reivindicações de Perfis</strong> do Administrador. Assim que aprovado, receberá uma notificação e o seu perfil será desbloqueado para que possa guardar os dados corretos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Checklist of what needs changing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Campos que necessita de corrigir:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'Nome Completo / Razão Social',
                    'Telefone / WhatsApp',
                    'NIF Angolano',
                    'Província / Morada',
                    'Nome da Loja',
                    'Fotografia / Logótipo'
                  ].map((field) => {
                    const isChecked = selectedFields.includes(field);
                    return (
                      <label
                        key={field}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none text-[11px] ${
                          isChecked
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFieldToggle(field)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{field}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Justification Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Motivo e Justificação da Correção: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isLimitReached || loading}
                  placeholder="Explique detalhadamente por que motivo os dados atuais estão incorretos e quais os novos valores a atualizar (ex: NIF foi digitado com um dígito trocado; mudança de contacto telefónico profissional)..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  O administrador irá analisar esta justificação para autorizar a libertação da edição do perfil.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimProfileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLimitReached || loading || reason.trim().length < 10}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    'A submeter pedido...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submeter Pedido de Reivindicação
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
