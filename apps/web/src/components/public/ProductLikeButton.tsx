'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';

interface ProductLikeButtonProps {
  productId: number;
  initialLikes: number;
  initialLiked?: boolean;
  size?: 'sm' | 'md';
}

export function ProductLikeButton({
  productId,
  initialLikes,
  initialLiked = false,
  size = 'sm',
}: ProductLikeButtonProps) {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/cuenta?next=${returnUrl}`);
      return;
    }

    if (loading) return;

    // Actualización optimista de la UI
    const prevLiked = liked;
    const prevLikes = likes;
    setLiked(!prevLiked);
    setLikes(prevLiked ? likes - 1 : likes + 1);
    setLoading(true);

    try {
      const token = await getToken();
      await api.post('/api/likes/toggle', { productId }, { token });
    } catch (err) {
      // Revertir en caso de error
      setLiked(prevLiked);
      setLikes(prevLikes);
      console.error('Error al dar like:', err);
    } finally {
      setLoading(false);
    }
  }

  const isMd = size === 'md';

  return (
    <button
      type="button"
      onClick={handleLike}
      title={liked ? 'Quitar Me gusta' : 'Dar Me gusta'}
      className={`inline-flex items-center gap-1.5 transition-all active:scale-95 ${
        isMd
          ? 'bg-party-pink/10 hover:bg-party-pink/20 text-party-pink px-3.5 py-1.5 rounded-full text-sm font-bold'
          : 'hover:text-party-pink text-text-muted text-xs'
      }`}
    >
      <span
        className={`transition-transform duration-200 ${
          liked ? 'scale-110 text-party-pink fill-party-pink' : 'opacity-70'
        }`}
      >
        {liked ? '❤️' : '🤍'}
      </span>
      <span className={liked ? 'font-bold text-party-pink' : ''}>
        {likes} {isMd ? (likes === 1 ? 'Like' : 'Likes') : ''}
      </span>
    </button>
  );
}
