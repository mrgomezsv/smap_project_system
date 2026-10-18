'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { api, ApiError } from '@/lib/api';
import { fallbackToOriginal, thumbUrl } from '@/lib/media';
import { formatAlbumDate, type GalleryAlbumSummary } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminGaleriaPage() {
  const { getToken } = useAuth();
  const [albums, setAlbums] = useState<GalleryAlbumSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryAlbumSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<{ items: GalleryAlbumSummary[] }>('/api/gallery/admin/all', { getToken })
      .then((res) => setAlbums(res.items))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar los álbumes'))
      .finally(() => setLoading(false));
  }, [getToken]);

  async function togglePublished(album: GalleryAlbumSummary) {
    setTogglingId(album.id);
    try {
      await api.patch(`/api/gallery/${album.id}`, { published: !album.published }, { getToken });
      setAlbums((prev) =>
        prev.map((a) => (a.id === album.id ? { ...a, published: !a.published } : a)),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado');
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/gallery/${deleteTarget.id}`, { getToken });
      setAlbums((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar el álbum');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">Galería</h1>
          <p className="text-text-muted mt-1">
            Álbumes de fiestas atendidas: fotos, descripción y productos usados.
          </p>
        </div>
        <Link href="/admin/galeria/nuevo" className="btn btn-primary">
          + Nuevo álbum
        </Link>
      </header>

      {error && (
        <div className="mb-4 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <p className="text-text-muted">Cargando álbumes…</p>
      ) : albums.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3 opacity-40">📸</div>
          <p className="font-semibold text-text-primary">Aún no hay álbumes</p>
          <p className="text-sm text-text-muted mt-1 mb-4">
            Crea el primero con las fotos de una fiesta que hayan atendido.
          </p>
          <Link href="/admin/galeria/nuevo" className="btn btn-primary">
            Crear álbum
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {albums.map((album) => (
            <div key={album.id} className="card p-0 overflow-hidden flex flex-col">
              <Link href={`/admin/galeria/${album.id}`} className="block aspect-[16/9] bg-gray-100">
                {album.cover ? (
                  <img
                    src={thumbUrl(album.cover.path)}
                    onError={(e) => fallbackToOriginal(e, album.cover!.path)}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">
                    📷
                  </div>
                )}
              </Link>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-bold text-text-primary line-clamp-2">{album.title}</h3>
                  <span
                    className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      album.published ? 'bg-success/15 text-success' : 'bg-gray-200 text-text-muted'
                    }`}
                  >
                    {album.published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  {formatAlbumDate(album.eventDate, 'es') ?? 'Sin fecha'} · {album.photoCount} foto(s)
                </p>
                <div className="mt-auto pt-2 flex flex-wrap gap-2">
                  <Link href={`/admin/galeria/${album.id}`} className="btn btn-outline !py-1.5 !px-3 text-sm">
                    ✏️ Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => togglePublished(album)}
                    disabled={togglingId === album.id || (!album.published && album.photoCount === 0)}
                    title={!album.published && album.photoCount === 0 ? 'Sube fotos antes de publicar' : undefined}
                    className="btn btn-outline !py-1.5 !px-3 text-sm"
                  >
                    {album.published ? '🙈 Ocultar' : '🌐 Publicar'}
                  </button>
                  {album.published && (
                    <a
                      href={`/galeria/${album.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline !py-1.5 !px-3 text-sm"
                    >
                      👁 Ver
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(album)}
                    className="btn !py-1.5 !px-3 text-sm text-danger hover:bg-danger/10"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Eliminar álbum"
        message={`Se eliminará "${deleteTarget?.title ?? ''}" con todas sus fotos. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isDanger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
