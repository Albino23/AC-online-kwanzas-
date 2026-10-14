import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Send, Store, User as UserIcon, MessageSquare, ArrowLeft, ShieldCheck, CheckCheck } from 'lucide-react';

export const ChatDrawer: React.FC = () => {
  const {
    chatDrawerOpen,
    setChatDrawerOpen,
    currentUser,
    isVendor,
    userStore,
    stores,
    conversations,
    activeConversationId,
    activeConversationMessages,
    sendChatMessage,
    openChatWithCustomer,
    openChatWithStore,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationMessages]);

  if (!chatDrawerOpen) return null;

  // Active conversation metadata
  const currentConv = conversations.find((c) => c.id === activeConversationId);

  // Get conversations relevant to this user
  // If vendor: conversations where storeId === userStore?.id
  const vendorConversations = userStore
    ? conversations.filter((c) => c.storeId === userStore.id)
    : [];

  // If customer: conversations where customerId === currentUser?.id
  const customerConversations = currentUser
    ? conversations.filter((c) => c.customerId === currentUser.id)
    : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {activeConversationId && (isVendor ? vendorConversations.length > 0 : customerConversations.length > 1) && (
              <button
                onClick={() => {
                  // Go back to conversation list
                  // Clearing active conversation id or setting to null
                }}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Voltar à lista"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              {isVendor ? <UserIcon className="w-5 h-5 text-amber-400" /> : <Store className="w-5 h-5 text-amber-400" />}
            </div>

            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5 font-display">
                {isVendor
                  ? currentConv
                    ? currentConv.customerName
                    : 'Mensagens de Clientes'
                  : currentConv
                  ? currentConv.storeName
                  : 'Atendimento da Loja'}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                {isVendor
                  ? currentConv
                    ? `Cliente Privado • ${currentConv.customerEmail}`
                    : `${vendorConversations.length} conversas com clientes`
                  : currentConv
                  ? 'Canal Direto e Privado com a Loja'
                  : 'Selecione uma conversa'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setChatDrawerOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product reference chip if conversation started from product */}
        {currentConv?.productName && (
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
            <span className="truncate">
              Artigo em questão: <strong className="font-semibold">{currentConv.productName}</strong>
            </span>
          </div>
        )}

        {/* BODY: IF NO ACTIVE CONVERSATION OR IN CONVERSATION LIST MODE */}
        {!activeConversationId ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {isVendor ? 'Conversas com Clientes da Loja' : 'As Suas Conversas com Lojistas'}
            </h4>

            {(isVendor ? vendorConversations : customerConversations).length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">Nenhuma conversa ativa</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {isVendor
                    ? 'Quando os clientes enviarem mensagens sobre os seus produtos, as conversas individuais aparecerão aqui.'
                    : 'Pode iniciar uma conversa com qualquer loja na página de detalhes do produto ou no diretório de lojas.'}
                </p>
              </div>
            ) : (
              (isVendor ? vendorConversations : customerConversations).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    if (isVendor) {
                      openChatWithCustomer(conv.storeId, conv.customerId);
                    } else {
                      openChatWithStore(conv.storeId);
                    }
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    {isVendor ? (
                      <UserIcon className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Store className="w-5 h-5 text-amber-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {isVendor ? conv.customerName : conv.storeName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* ACTIVE 1-ON-1 ISOLATED CONVERSATION */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              <div className="text-center my-2">
                <span className="text-[11px] bg-slate-200/70 text-slate-600 px-3 py-1 rounded-full">
                  Canal seguro e encriptado entre Comprador e Loja
                </span>
              </div>

              {activeConversationMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Sem mensagens anteriores. Escreva a sua mensagem para iniciar a conversa.
                </div>
              ) : (
                activeConversationMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-amber-600 text-white rounded-br-none'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        {!isMe && (
                          <span className="block text-[10px] font-bold text-amber-700 mb-0.5">
                            {msg.senderName}
                          </span>
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-amber-600" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escreva uma mensagem para a loja..."
                className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm border-none focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
