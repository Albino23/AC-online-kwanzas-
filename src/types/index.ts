export type UserRole = 'cliente' | 'vendedor' | 'admin';

export type StoreStatus = 'pendente' | 'ativa' | 'reivindicada' | 'suspensa';

export type OrderStatus =
  | 'aguardando_pagamento'
  | 'comprovativo_enviado'
  | 'em_verificacao'
  | 'pagamento_confirmado'
  | 'pagamento_rejeitado'
  | 'em_preparacao'
  | 'a_caminho'
  | 'concluida'
  | 'cancelada';

export type PaymentMethodType = 'iban' | 'referencia' | 'multicaixa_express' | 'entrega';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  storeId?: string;
  avatar?: string;
  province?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  createdAt: string;
}

export interface StorePaymentDetails {
  // IBAN
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber: string;
  ibanActive: boolean;

  // Referência Multicaixa
  entity?: string;
  reference?: string;
  referenceInstructions?: string;
  referenceActive: boolean;

  // Multicaixa Express
  mcxPhone?: string;
  mcxInstructions?: string;
  mcxActive: boolean;

  // Pagamento na Entrega
  deliveryPaymentActive: boolean;
  deliveryInstructions?: string;
}

export interface Store {
  id: string;
  ownerId: string;
  ownerEmail: string;
  name: string;
  nif: string;
  category: string;
  province: string;
  address: string;
  logo: string;
  banner?: string;
  rating: number;
  totalSales: number;
  freeTrialStartDate: string; // ISO date
  freeTrialEndDate: string; // ISO date (60 days)
  isVip: boolean;
  vipPrice?: number;
  vipStatus?: 'nenhum' | 'solicitado' | 'aprovado' | 'rejeitado';
  status: StoreStatus;
  claimReason?: string; // Motivo quando reivindicada pelo administrador
  isSuspended?: boolean;
  suspensionReason?: string;
  supportPhone?: string;
  supportEmail?: string;
  paymentDetails: StorePaymentDetails;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description: string;
  price: number; // Em Kwanzas (Kz)
  originalPrice?: number;
  stock: number;
  category: string;
  province: string;
  images: string[];
  featured: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  storeId: string;
  storeName: string;
}

export interface Order {
  id: string;
  orderNumber: string; // ACKZ-XXXXX
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  totalAmount: number; // Em Kwanzas
  deliveryFee: number;
  deliveryProvince: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethodType;
  paymentProofUrl?: string; // Comprovativo anexado
  paymentReference?: string; // Ref bancária / ID da transação do cliente
  paymentRejectionReason?: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutTransaction {
  id: string;
  storeId: string;
  storeName: string;
  amount: number; // Em Kwanzas
  method: 'iban' | 'multicaixa_express' | 'referencia';
  bankName?: string;
  accountHolder?: string;
  iban?: string;
  accountNumber?: string;
  mcxPhone?: string;
  status: 'concluido' | 'pendente' | 'em_processamento';
  date: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'cliente' | 'vendedor' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string; // Ex: conv_storeId_customerId
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productId?: string;
  productName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadByStore: number;
  unreadByCustomer: number;
}

export interface NotificationItem {
  id: string;
  userId: string; // Para quem se destina a notificação
  title: string;
  message: string;
  type: 'order' | 'payment' | 'chat' | 'store_approval' | 'store_claim' | 'vip' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  targetType: 'store' | 'product' | 'order' | 'user';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  status: 'pendente' | 'investigando' | 'resolvida' | 'rejeitada';
  resolutionNotes?: string;
  createdAt: string;
}
