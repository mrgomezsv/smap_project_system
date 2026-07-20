/**
 * Tipos TypeScript compartidos con el backend.
 * Reflejan los modelos Prisma del apps/api/prisma/schema.prisma
 */

export type Category =
  | 'option1' // Bounce House
  | 'option2' // Electric Games
  | 'option3' // Furniture
  | 'option4' // Concession Machines
  | 'option5' // Competitive Games
  | 'option6' // Equipment Rental
  | 'option7'; // Water Fun for Rent

export const CATEGORY_LABELS: Record<Category, string> = {
  option1: 'Brincolines',
  option2: 'Juegos Eléctricos',
  option3: 'Mobiliario',
  option4: 'Máquinas de Concesión',
  option5: 'Juegos Competitivos',
  option6: 'Equipos en Alquiler',
  option7: 'Juegos de Agua',
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

export type EventPartner = 'partner1' | 'partner2' | 'partner3';

export const PARTNER_LABELS: Record<EventPartner, { label: string; color: string }> = {
  partner1: { label: 'Kidsfun', color: 'bg-primary' },
  partner2: { label: 'Tecun Productions', color: 'bg-info' },
  partner3: { label: 'Otros', color: 'bg-text-muted' },
};

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
