import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Camera,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Store,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ANGOLA_PROVINCES } from '../../data/mockData';

export const ProfileModal: React.FC = () => {
  const {
    currentUser,
    profileModalOpen,
    setProfileModalOpen,
    setClaimProfileModalOpen,
    updateProfile,
    createPasswordForGoogle,
    setChangePasswordModalOpen,
    setCurrentView,
    userStore,
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password creation state for Google users
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sync form when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setProvince(currentUser.province || 'Luanda');
      setAvatar(currentUser.avatar || '');
      setSuccessMessage('');
      setErrorMessage('');
      setPasswordSuccess('');
      setPasswordError('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [currentUser, profileModalOpen]);

  if (!profileModalOpen || !currentUser) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor introduza o seu nome completo.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      province,
      avatar: avatar.trim(),
    });

    setLoading(false);
    if (res.success) {
      setSuccessMessage('Perfil atualizado e guardado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } else {
      setErrorMessage(res.error || 'Erro ao atualizar o perfil.');
    }
  };

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.trim().length < 6) {
      setPasswordError('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError('As palavras-passe introduzidas não coincidem.');
      return;
    }

    setPasswordLoading(true);
    const res = await createPasswordForGoogle(newPassword.trim());
    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess('Palavra-passe criada com sucesso! Agora pode entrar com Google ou com E-mail e Palavra-passe.');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Erro ao definir a palavra-passe.');
    }
  };

  const isGoogleUser = currentUser.authProvider === 'google';
  const hasPasswordSet = currentUser.hasPassword || (currentUser as any).passwordHash && (currentUser as any).passwordHash !== 'google_auth_no_password';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white relative shrink-0">
          <button
            onClick={() => setProfileModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
              AC Online Kwanza • Perfil do Utilizador
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center overflow-hidden text-white font-bold text-xl shadow-inner">
                {avatar ? (
                  <img src={avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">
                  {currentUser.name}
                </h2>
                <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                  <span>{currentUser.email}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold">
                    {currentUser.role === 'admin'
                      ? 'Administrador Geral'
                      : currentUser.role === 'vendedor'
                      ? 'Vendedor'
                      : 'Cliente'}
                  </span>
                </p>
              </div>
            </div>

            {/* Provider indicator */}
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block mb-1">Método de Autenticação</span>
              {isGoogleUser ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-800 font-bold text-xs shadow-xs">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Conta Google
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-bold text-xs border border-slate-700">
                  <Mail className="w-3.5 h-3.5" />
                  E-mail & Senha
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* GOOGLE INCOMPLETE PROFILE REMINDER */}
          {isGoogleUser && (!currentUser.phone || !currentUser.province) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Conta Criada via Google — Complete os Dados em Falta</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Como acedeu através da Google, deve preencher o seu <strong>Telefone / WhatsApp</strong> e <strong>Província</strong> abaixo para que os comerciantes e estafetas possam contactá-lo e concluir encomendas.
              </p>
            </div>
          )}

          {/* SINGLE PROFILE EDIT / CLAIMS STATUS BANNER */}
          {(() => {
            const editsCount = currentUser.profileEditsCount || 0;
            const isUnlockedByAdmin = !!currentUser.profileEditUnlocked;
            const canEditDirectly = editsCount === 0 || isUnlockedByAdmin || currentUser.role === 'admin';
            const claimsUsed = currentUser.claimsCount || 0;
            const claimsRemaining = Math.max(0, 5 - claimsUsed);

            if (canEditDirectly) {
              return (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  isUnlockedByAdmin
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isUnlockedByAdmin ? 'text-emerald-600' : 'text-blue-600'}`} />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5">
                      {isUnlockedByAdmin ? 'Edição Desbloqueada pela Administração' : 'Primeira Edição Livre de Perfil'}
                    </h4>
                    <p className="text-[11px] leading-relaxed">
                      {isUnlockedByAdmin
                        ? 'O administrador aprovou o seu pedido de reivindicação. Pode atualizar os dados autorizados e clicar em «Guardar». Após guardar, o perfil ficará novamente bloqueado para sua proteção.'
                        : 'Cada utilizador pode editar e guardar os dados do seu perfil livremente 1 única vez. Após guardar, quaisquer correções futuras deverão ser solicitadas via «Reivindicar correção dos dados».'}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        Perfil Bloqueado para Edição Direta
                      </h4>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {claimsUsed} de 5 Reivindicações Utilizadas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      O seu perfil já foi editado livremente uma vez. Para corrigir dados incorretos (ex: NIF, nome fiscal, telefone, província), clique no botão abaixo para submeter um pedido de reivindicação com o motivo. O administrador irá analisar e libertar a edição.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Restam <strong>{claimsRemaining}</strong> de 5 pedidos de reivindicação vitalícios.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalOpen(false);
                      setClaimProfileModalOpen(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Reivindicar Correção dos Dados
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Success / Error alerts */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="font-bold">•</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* EDIT PROFILE FORM */}
          {(() => {
            const editsCount = currentUser.profileEditsCount || 0;
            const isUnlockedByAdmin = !!currentUser.profileEditUnlocked;
            const canEditDirectly = editsCount === 0 || isUnlockedByAdmin || currentUser.role === 'admin';

            return (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-amber-600" />
                    Informações Pessoais & Contacto
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {canEditDirectly ? 'Edição Disponível' : 'Protegido / Somente Leitura'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        disabled={!canEditDirectly}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Endereço de E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-xl outline-none cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Identificador único de segurança e autenticação.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telefone / WhatsApp {isGoogleUser && !phone && <span className="text-amber-600 font-bold">(Obrigatório)</span>}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        disabled={!canEditDirectly}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="923 000 000"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Província
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <select
                        disabled={!canEditDirectly}
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                      >
                        {ANGOLA_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL da Fotografia de Perfil (Opcional)
                    </label>
                    <div className="relative">
                      <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="url"
                        disabled={!canEditDirectly}
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://exemplo.com/minha-foto.jpg"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {!canEditDirectly && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        Edição direta desativada. Submeta uma reivindicação para alterar.
                      </span>
                    )}
                  </div>

                  {canEditDirectly ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      {loading ? 'A guardar alterações...' : 'Guardar Alterações do Perfil'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalOpen(false);
                        setClaimProfileModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Reivindicar correção dos dados
                    </button>
                  )}
                </div>
              </form>
            );
          })()}

          {/* VENDOR STORE SHORTCUT */}
          {currentUser.role === 'vendedor' && userStore && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-700" />
                  Loja Comercial Associada: {userStore.name}
                </h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Status: <span className="font-bold uppercase">{userStore.status}</span> • NIF: {userStore.nif}
                </p>
              </div>
              <button
                onClick={() => {
                  setProfileModalOpen(false);
                  setCurrentView('vendor-dashboard');
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Gerir Loja
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* PASSWORD MANAGEMENT SECTION */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                Segurança & Palavra-passe
              </h3>
            </div>

            {/* CASE A: Google user who has NOT set a password yet (Requirement 3) */}
            {isGoogleUser && !hasPasswordSet ? (
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Criar Palavra-passe de Acesso Própria (Opcional)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Como acedeu com a sua conta Google, atualmente só pode entrar através da Google.
                      Se desejar, crie uma palavra-passe própria abaixo: poderá continuar a entrar tanto com o Google como com o seu e-mail e palavra-passe.
                    </p>
                  </div>
                </div>

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold">
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleCreatePasswordSubmit} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirmar Palavra-passe
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a palavra-passe"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                    >
                      {passwordLoading ? 'A gravar...' : 'Ativar Palavra-passe Própria'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* CASE B: User with password set (or Google user who created password) */
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Palavra-passe de acesso configurada
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isGoogleUser
                      ? 'Pode iniciar sessão utilizando tanto a Google como o seu E-mail e Palavra-passe.'
                      : 'A sua conta está protegida por palavra-passe criptografada.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setChangePasswordModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Alterar Palavra-passe
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dados protegidos pelo Supabase Auth & Políticas RLS</span>
          </div>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
