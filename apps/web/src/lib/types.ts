/**
 * Tipos TypeScript compartidos con el backend.
 * Reflejan los modelos Prisma del apps/api/prisma/schema.prisma
 */

export type Category = string;

export interface CategoryItem {
  id: number;
  slug: string;
  name: string;
  nameEs: string;
  nameEn: string | null;
  emoji: string;
  color: string;
  position: number;
  isActive: boolean;
  productCount?: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  option1: 'Brincolines',
  option2: 'Juegos Eléctricos',
  option3: 'Mobiliario',
  option4: 'Máquinas de Concesión',
  option5: 'Juegos Competitivos',
  option6: 'Equipos en Alquiler',
  option7: 'Juegos de Agua',
  toros_mecanicos: 'Toros Mecánicos',
  trenes_electricos: 'Trenes Eléctricos',
  kiddie_ride: 'Kiddie Ride',
  maquina_espuma: 'Máquina de Espuma',
  game_trailer: 'Game Trailer',
  robots_led: 'Robots LED',
  shots_carts: 'Shots Carts',
  obstacle_course: 'Obstacle Course',
};

export interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  category: Category;
  publicated: boolean;
  dimensions: string | null;
  space: string | null;
  circuits: string | null;
  youtubeUrl: string | null;
  img: string;
  img1: string;
  img2: string;
  img3: string;
  img4: string;
  img5: string;
  created: string;
  userId: number;
  user?: {
    id: number;
    username: string;
  };
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface ProductsListResponse {
  items: Product[];
  total: number;
  skip: number;
  take: number;
}

export interface Comment {
  id: number;
  productId: number;
  userId: string | null;
  userDisplayName: string | null;
  comment: string;
  createdAt: string;
  replies?: CommentReply[];
}

export interface CommentReply {
  id: number;
  commentId: number;
  userId: string | null;
  userDisplayName: string | null;
  replyText: string;
  createdAt: string;
}

export interface LikeResponse {
  count: number;
}

export interface MetricsResponse {
  range: { from: string; to: string };
  waiversByMonth: Array<{ month: string; waivers: number }>;
  topProducts: Array<{ id: string; name: string; interactions: number }>;
  waiverStatuses: Array<{ name: string; value: number; color: string }>;
  trend: Array<{
    date: string;
    label: string;
    likes: number;
    comments: number;
    waivers: number;
  }>;
  totals: { waivers: number; likes: number; comments: number };
  users: { total: number; active: number; inactive: number; newInRange: number };
  waiverOperations: {
    scans: number;
    uniqueScanned: number;
    relatives: number;
    scanRate: number | null;
  };
  events: {
    created: number;
    scheduled: number;
    upcomingPublished: number;
    byPartner: Array<{ name: string; events: number }>;
  };
  communications: {
    contacts: number;
    unreadContacts: number;
    chatMessages: number;
    unreadChatMessages: number;
    activeChatRooms: number;
    uniqueChatRooms: number;
    trend: Array<{
      date: string;
      label: string;
      contacts: number;
      chats: number;
    }>;
  };
  catalog: {
    totalProducts: number;
    publishedProducts: number;
    categories: Array<{
      category: string;
      products: number;
      published: number;
      interactions: number;
    }>;
  };
}

export interface IsFavoriteResponse {
  isFavorite: boolean;
}

export interface WaiverRelative {
  name: string;
  age: number;
}

export interface Waiver {
  id: number;
  qrCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  relatives: Array<{
    id: number;
    waiverQrId: number;
    relativeName: string;
    relativeAge: number;
    timestamp: string;
  }>;
  scans?: Array<{
    id: number;
    scannedBy: string;
    scannedAt: string;
  }>;
}

export interface WaiverResponse {
  waiver: Waiver;
  isValid: boolean;
}

export type EventPartner = 'partner1' | 'partner2' | 'partner3' | string;

export const PARTNER_LABELS: Record<string, { label: string; color: string }> = {
  partner1: { label: 'Kidsfun', color: 'bg-primary' },
  partner2: { label: 'Tecun Productions', color: 'bg-info' },
  partner3: { label: 'Otros', color: 'bg-text-muted' },
  Kidsfun: { label: 'Kidsfun', color: 'bg-primary' },
  'Tecun Productions': { label: 'Tecun Productions', color: 'bg-info' },
};

export function getPartnerDisplay(partnerKey?: string | null): { label: string; color: string } {
  if (!partnerKey) return { label: 'Kidsfun', color: 'bg-primary' };
  if (PARTNER_LABELS[partnerKey]) return PARTNER_LABELS[partnerKey];
  return { label: partnerKey, color: 'bg-primary-600' };
}

export interface Event {
  id: number;
  title: string;
  description: string;
  image: string | null;
  location: string;
  startDatetime: string;
  ticketPrice: number;
  published: boolean;
  partners: EventPartner | string;
  slug: string | null;
}

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  userId?: number;
}

export type ContractStatus = 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';

export type DocumentKind =
  | 'ISSUED_PDF'
  | 'ELECTRONIC_SIGNED_PDF'
  | 'UPLOADED_SIGNED_PDF'
  | 'PAYMENT_RECEIPT'
  | 'OTHER';

export type PaymentType = 'DEPOSIT' | 'PAYMENT' | 'REFUND';

export interface ContractDocument {
  id: number | string;
  contractId: number;
  paymentId: number | string | null;
  kind: DocumentKind | string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

export interface ContractPayment {
  id: number | string;
  contractId: number;
  type: PaymentType | string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
}

export interface ContractAdminDetail {
  id: number;
  token: string;
  status: ContractStatus | string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  clientAddress: string;
  clientCityStateZip: string | null;
  driverLicense: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  equipment: string;
  groundType: string | null;
  price: number | null;
  deposit: number | null;
  notes: string | null;
  signedAt: string | null;
  signatureMethod: string | null;
  signerIp: string | null;
  expiresAt: string | null;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdById: number | null;
  client: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    userId: number | null;
  } | null;
  documents: ContractDocument[];
  payments: ContractPayment[];
  totals: {
    totalPaid: number;
    balanceDue: number;
    price: number;
    deposit: number;
  };
}

export interface ContractSummary {
  id: number;
  token: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  eventDate: string | null;
  equipment: string;
  status: ContractStatus | string;
  price: number | null;
  deposit: number | null;
  createdAt: string;
  signedAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
}

export interface ContractCreateResponse {
  contract: {
    id: number;
    token: string;
    status: ContractStatus | string;
  };
  signUrl: string;
  emailSent: boolean;
  documentId: number | string | null;
}

export interface Client {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  cityStateZip: string | null;
  driverLicense: string | null;
  userId: number | null;
  source: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { rentalContracts: number };
  user?: {
    id: number;
    email: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  rentalContracts?: Array<{
    id: number;
    token: string;
    clientName: string;
    clientEmail: string;
    equipment: string;
    eventDate: string | null;
    status: ContractStatus | string;
    price: number | null;
    deposit: number | null;
    createdAt: string;
    signedAt: string | null;
  }>;
}

export interface ClientsListResponse {
  items: Client[];
  total: number;
  skip: number;
  take: number;
}
