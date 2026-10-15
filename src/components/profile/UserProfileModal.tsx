import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ANGOLA_PROVINCES } from '../../data/mockData';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  CheckCircle2,
  Shield,
  Store,
  ShoppingBag,
  KeyRound,
  Save,
  Sparkles
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
];

export const UserProfileModal: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isVendor,
    profileModalOpen,
    setProfileModalOpen,
    updateProfile,
    createPasswordForGoogle,
    setChangePasswordModalOpen,
    showToast
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [avatar, setAvatar] = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Create password for Google account
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setProvince(currentUser.province || 'Luanda');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser, profileModalOpen]);

  if (!profileModalOpen || !currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome não pode estar em branco.', 'error');
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      province,
      avatar: avatar.trim(),
    });
    setSaving(false);

    if (res.success) {
      setProfileModalOpen(false);
    }
  };

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('A palavra-passe deve conter pelo menos 6 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('As palavras-passe não coincidem.', 'error');
      return;
    }

    setPasswordLoading(true);
    const res = await createPasswordForGoogle(newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setNewPassword('');
      setConfirmPassword('');
      setShowCreatePassword(false);
    }
  };

  const isGoogleAccount = currentUser.authProvider === 'google';
  const hasPasswordConfigured = currentUser.hasPassword !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white relative flex-shrink-0">
          <button
            onClick={() => setProfileModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
              AC Online Kwanza
            </span>
          </div>

          <h2 className="text-2xl font-bold font-display">O Meu Perfil</h2>
          <p className="text-xs text-slate-300 mt-1">
            Gestão dos seus dados de conta, informações de contacto e métodos de acesso.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="relative group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
                  onError={() => setAvatar('')}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-2xl flex items-center justify-center shadow-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 text-white rounded-full shadow hover:bg-amber-600 transition-colors cursor-pointer"
                title="Mudar fotografia"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</h3>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                  {isAdmin ? (
                    <>
                      <Shield className="w-3 h-3 text-amber-600" /> Super Administrador
                    </>
                  ) : isVendor ? (
                    <>
                      <Store className="w-3 h-3 text-emerald-600" /> Vendedor / Loja
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3 h-3 text-blue-600" /> Cliente Comprador
                    </>
                  )}
                </span>

                {isGoogleAccount ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Acesso Google
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    <Mail className="w-3 h-3 text-slate-500" />
                    E-mail e Palavra-passe
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Avatar Selector Dropdown */}
          {showAvatarPicker && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-150 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Escolher Fotografia de Perfil:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(url);
                      setShowAvatarPicker(false);
                    }}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      avatar === url ? 'border-amber-600 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ou insira a ligação URL da sua imagem:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput.trim()) {
                        setAvatar(customAvatarInput.trim());
                        setShowAvatarPicker(false);
                        setCustomAvatarInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo / Razão Social
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome de utilizador"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
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
                  className="w-full pl-10 pr-24 py-2.5 text-sm border border-slate-200 bg-slate-100 text-slate-600 rounded-xl cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
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
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    {ANGOLA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'A guardar alterações...' : 'Guardar Alterações do Perfil'}
            </button>
          </form>

          {/* Access & Password Section */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-600" /> Segurança & Acesso
            </h4>

            {/* If Google account and has no password created yet */}
            {isGoogleAccount && !hasPasswordConfigured && !showCreatePassword && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-950">
                      Criar Palavra-passe Opcional
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Entrou com a sua Conta Google. Se desejar, pode criar uma palavra-passe própria para poder entrar tanto com Google como com e-mail e palavra-passe.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(true)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Criar Palavra-passe de Acesso
                </button>
              </div>
            )}

            {/* Form to create password for Google account */}
            {showCreatePassword && (
              <form onSubmit={handleCreatePasswordSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" /> Definir Nova Palavra-passe
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nova Palavra-passe (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Confirmar Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(false)}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {passwordLoading ? 'A guardar...' : 'Confirmar Palavra-passe'}
                  </button>
                </div>
              </form>
            )}

            {/* If user already has a password or is Super Admin */}
            {hasPasswordConfigured && (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">Palavra-passe de Acesso</p>
                  <p className="text-[11px] text-slate-500">
                    {isGoogleAccount
                      ? 'Possui palavra-passe configurada. Pode entrar com Google ou E-mail + Senha.'
                      : 'Protegida por criptografia de segurança SHA-256.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setChangePasswordModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Alterar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
