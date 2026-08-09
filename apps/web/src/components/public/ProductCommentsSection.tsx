'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';

interface CommentItem {
  id: number;
  productId: number;
  authorName: string;
  comment: string;
  createdAt: string;
  isApproved: boolean;
}

interface ProductCommentsSectionProps {
  productId: number;
  initialCommentsCount: number;
}

export function ProductCommentsSection({
  productId,
  initialCommentsCount,
}: ProductCommentsSectionProps) {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tProduct = useTranslations('product');

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadComments() {
      try {
        setLoading(true);
        setComments([]);
        const data = await api.get<CommentItem[]>(`/api/comments/product/${productId}`);
        if (isMounted) {
          setComments(data);
        }
      } catch (err) {
        console.error('Error cargando comentarios:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadComments();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  function handleRequireAuth() {
    const returnUrl = encodeURIComponent(pathname);
    router.push(`/cuenta?next=${returnUrl}`);
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      handleRequireAuth();
      return;
    }

    if (!newComment.trim() || submitting) return;

    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const token = await getToken();
      const created = await api.post<CommentItem>(
        '/api/comments',
        { productId, comment: newComment.trim() },
        { token }
      );
      if (created.isApproved) {
        setComments((prev) => [created, ...prev]);
      } else {
        setNotice(tProduct('commentPending'));
      }
      setNewComment('');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al enviar el comentario'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const commentsCount = Math.max(comments.length, initialCommentsCount);

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-heading font-bold mb-6">
        {tProduct('comments')} ({commentsCount})
      </h2>

      {/* Formulario para agregar comentario */}
      <div className="card mb-8 p-6 bg-white border border-border rounded-2xl shadow-sm">
        {user ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                {user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {user.displayName || user.email}
              </span>
            </div>

            {notice && (
              <div className="p-3 bg-success/10 text-success text-sm rounded-lg border border-success/20">
                {notice}
              </div>
            )}

            {error && (
              <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">
                ⚠ {error}
              </div>
            )}

            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={tProduct('commentsPlaceholder')}
              className="input w-full p-3 resize-none text-sm"
              required
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="btn btn-primary px-6 py-2.5 text-sm font-semibold shadow-soft hover:shadow-medium disabled:opacity-50"
              >
                {submitting ? tProduct('commentSubmitting') : tProduct('commentSubmit')}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-text-muted">
              {tProduct('commentAuthPrompt')}
            </p>
            <button
              type="button"
              onClick={handleRequireAuth}
              className="btn btn-primary px-6 py-2.5 text-sm font-semibold shadow-soft hover:shadow-medium inline-flex items-center gap-2"
            >
              <span>🔒</span> {tProduct('commentLoginCta')}
            </button>
          </div>
        )}
      </div>

      {/* Lista de comentarios */}
      {loading ? (
        <div className="card text-center py-8 text-text-muted text-sm animate-pulse">
          {tProduct('commentsLoading')}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((item) => (
            <div
              key={item.id}
              className="card p-5 bg-white border border-border/80 rounded-xl space-y-2 hover:border-border transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-primary">
                  {item.authorName || tProduct('anonymousUser')}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                {item.comment}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3 opacity-30">💬</div>
          <p className="text-text-muted text-sm">
            {tProduct('noComments')}
          </p>
        </div>
      )}
    </div>
  );
}
