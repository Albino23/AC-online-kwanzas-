import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ANGOLA_PROVINCES } from '../../data/mockData';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, Store, ShoppingBag, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    authModalRole,
    setAuthModalRole,
    login,
    register,
    verifyRegistrationCode,
    resendRegistrationCode,
    requestPasswordReset,
    showToast,
  } = useApp();

  // Inputs MUST START COMPLETELY BLANK - no prefilled sample emails!
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification step state
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setErrorMessage('');
    setIsVerifyingCode(false);
    setIsForgotPassword(false);
    setForgotPasswordSent(false);
  };

  const handleRoleSelect = (role: 'cliente' | 'vendedor') => {
    setAuthModalRole(role);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor introduza o seu endereço de e-mail.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Por favor introduza a sua palavra-passe.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password.trim(), authModalRole);
    setLoading(false);

    if (result.success) {
      handleClose();
    } else {
      setErrorMessage(result.error || 'Credenciais inválidas.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor introduza o seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor introduza um endereço de e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const result = await register(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: authModalRole,
        province,
      },
      password.trim()
    );
    setLoading(false);

    if (result.success) {
      setPendingEmail(email.trim());
      setIsVerifyingCode(true);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setErrorMessage(result.error || 'Erro ao criar conta.');
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!verificationCode.trim()) {
      setErrorMessage('Por favor introduza o código de 6 dígitos recebido no seu e-mail.');
      return;
    }

    setLoading(true);
    const result = await verifyRegistrationCode(pendingEmail, verificationCode.trim());
    setLoading(false);

    if (result.success) {
      handleClose();
    } else {
      setErrorMessage(result.error || 'Código de confirmação incorreto ou expirado.');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const res = await resendRegistrationCode(pendingEmail);
    setLoading(false);

    if (res.success) {
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Erro ao reenviar código de confirmação.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor introduza o seu e-mail para recuperar o acesso.');
      return;
    }
    setLoading(true);
    const res = await requestPasswordReset(email.trim());
    setLoading(false);

    if (res.success) {
      setForgotPasswordSent(true);
    } else {
      setErrorMessage(res.error || 'Erro ao processar pedido de recuperação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
              AC Online Kwanza
            </span>
          </div>

          <h2 className="text-2xl font-bold font-display">
            {isVerifyingCode
              ? 'Confirmar E-mail'
              : isForgotPassword
              ? 'Recuperar Palavra-passe'
              : authModalMode === 'login'
              ? 'Iniciar Sessão'
              : 'Criar Nova Conta'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isVerifyingCode
              ? 'Introduza o código de 6 dígitos enviado para o seu correio eletrónico.'
              : isForgotPassword
              ? 'Insira o seu e-mail para receber as instruções de recuperação.'
              : authModalMode === 'login'
              ? 'Aceda à sua conta e continue as suas operações seguras em Kwanzas (Kz).'
              : 'Junte-se ao marketplace de Angola como comprador ou vendedor profissional.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Error alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
              <span className="font-bold">•</span>
              <p className="flex-1 text-xs leading-relaxed font-medium">{errorMessage}</p>
            </div>
          )}

          {/* CODE VERIFICATION SCREEN (NO CODE DISPLAYED ON SCREEN!) */}
          {isVerifyingCode ? (
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold text-sm mb-1 text-amber-950 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-700" /> Verificação de Segurança
                </p>
                Enviámos um código de confirmação para o endereço <strong className="underline">{pendingEmail}</strong>.
                Por razões de segurança e prevenção contra fraudes, o código deve ser consultado diretamente na sua caixa de correio eletrónico ou pasta de spam.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Código de 6 Dígitos
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 849201"
                    className="w-full pl-10 pr-4 py-2.5 text-center tracking-widest text-lg font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'A validar código...' : 'Confirmar e Aceder à Conta'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setIsVerifyingCode(false)}
                  className="hover:text-slate-900 underline"
                >
                  Voltar ao registo
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className={`font-medium ${
                    resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-amber-700 hover:underline cursor-pointer'
                  }`}
                >
                  {resendCooldown > 0 ? `Reenviar código em ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          ) : isForgotPassword ? (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              {forgotPasswordSent ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                  <p className="font-bold text-sm mb-1 text-emerald-950">Email Enviado!</p>
                  Se o endereço <strong className="underline">{email}</strong> corresponder a uma conta registada, receberá uma mensagem com a ligação para redefinir a sua palavra-passe com total segurança.
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    O Seu Endereço de E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@dominio.ao"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-md cursor-pointer"
              >
                {forgotPasswordSent ? 'Reenviar Instruções' : 'Enviar Ligação de Recuperação'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-xs text-amber-700 hover:underline font-medium"
                >
                  Voltar ao Início de Sessão
                </button>
              </div>
            </form>
          ) : (
            /* STANDARD LOGIN / REGISTER FLOW */
            <div>
              {/* Role Selector Buttons (STRICTLY NO PRE-FILLED EMAILS!) */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo de Conta:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('cliente')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      authModalRole === 'cliente'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                    Conta Cliente
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('vendedor')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      authModalRole === 'vendedor'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    Conta Vendedor
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  {authModalRole === 'cliente'
                    ? 'Comprador: consulte produtos, faça encomendas e converse com as lojas.'
                    : 'Comerciante: venda os seus produtos, gerencie estoque e receba pagamentos em Kwanzas.'}
                </p>
              </div>

              {/* Login or Register Form */}
              <form onSubmit={authModalMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-3.5">
                {authModalMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nome Completo {authModalRole === 'vendedor' ? 'ou Razão Social' : ''}
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={authModalRole === 'vendedor' ? 'Ex: Comércio Silva Lda' : 'Ex: João António Manuel'}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Telefone / WhatsApp
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="923 000 000"
                            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
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
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            className="w-full pl-9 pr-2 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                          >
                            {ANGOLA_PROVINCES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Email input (BLANK BY DEFAULT) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@dominio.ao"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password input (BLANK BY DEFAULT) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Palavra-passe
                    </label>
                    {authModalMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[11px] text-amber-700 hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading
                    ? 'A processar...'
                    : authModalMode === 'login'
                    ? `Entrar como ${authModalRole === 'cliente' ? 'Cliente' : 'Vendedor'}`
                    : `Registar como ${authModalRole === 'cliente' ? 'Cliente' : 'Vendedor'}`}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Mode Toggle */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                {authModalMode === 'login' ? (
                  <p>
                    Ainda não tem conta registada?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('register');
                        setErrorMessage('');
                      }}
                      className="text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Criar Conta Agora
                    </button>
                  </p>
                ) : (
                  <p>
                    Já possui uma conta na plataforma?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('login');
                        setErrorMessage('');
                      }}
                      className="text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      Iniciar Sessão
                    </button>
                  </p>
                )}
              </div>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autenticação criptografada & validação de segurança nacional</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
