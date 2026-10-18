'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { api, ApiError } from '@/lib/api';
import { compressImage } from '@/lib/image-compress';
import { fallbackToOriginal, thumbUrl } from '@/lib/media';
import type { GalleryAlbum, GalleryPhoto, ProductsListResponse } from '@/lib/types';

/** Fotos enviadas por petición (evita peticiones enormes en conexiones lentas). */
const BATCH_SIZE = 4;

interface FormState {
  title: string;
  description: string;
  eventDate: string;
  location: string;
  published: boolean;
  productIds: number[];
}

const EMPTY: FormState = {
  title: '',
  description: '',
  eventDate: '',
  location: '',
  published: false,
  productIds: [],
};

function toForm(a: GalleryAlbum): FormState {
  return {
    title: a.title,
    description: a.description ?? '',
    eventDate: a.eventDate ? a.eventDate.slice(0, 10) : '',
    location: a.location ?? '',
    published: a.published,
    productIds: a.products.map((p) => p.id),
  };
}

export function AlbumEditor({ albumId }: { albumId?: number }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const isEdit = typeof albumId === 'number' && !Number.isNaN(albumId);

  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [products, setProducts] = useState<Array<{ id: number; title: string; img: string }>>([]);
  const [productSearch, setProductSearch] = useState('');

  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<GalleryPhoto | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (ok: boolean, text: string) => {
    setMessage({ ok, text });
    if (ok) setTimeout(() => setMessage(null), 3000);
  };
  const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

  const reload = useCallback(async () => {
    if (!isEdit) return;
    const a = await api.get<GalleryAlbum>(`/api/gallery/admin/${albumId}`, { getToken });
    setAlbum(a);
    setForm(toForm(a));
  }, [albumId, getToken, isEdit]);

  useEffect(() => {
    reload()
      .catch((e) => flash(false, errorText(e, 'No se pudo cargar el álbum')))
      .finally(() => setLoading(false));
    api
      .get<ProductsListResponse>('/api/products?take=100', { getToken })
      .then((res) =>
        setProducts(res.items.map((p) => ({ id: Number(p.id), title: p.title, img: p.img }))),
      )
      .catch(() => setProducts([]));
  }, [reload, getToken]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return term ? products.filter((p) => p.title.toLowerCase().includes(term)) : products;
  }, [products, productSearch]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleProduct(id: number) {
    update(
      'productIds',
      form.productIds.includes(id) ? form.productIds.filter((p) => p !== id) : [...form.productIds, id],
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      flash(false, 'El título es obligatorio');
      return;
    }
    setSaving(true);
    setMessage(null);
    const payload = {
      title: form.title.trim(),
      description: form.description,
      eventDate: form.eventDate || null,
      location: form.location,
      published: form.published && (album?.photos.length ?? 0) > 0,
      productIds: form.productIds,
    };
    try {
      if (isEdit) {
        const a = await api.patch<GalleryAlbum>(`/api/gallery/${albumId}`, payload, { getToken });
        setAlbum(a);
        setForm(toForm(a));
        flash(true, 'Álbum guardado');
      } else {
        const a = await api.post<GalleryAlbum>('/api/gallery', { ...payload, published: false }, { getToken });
        router.push(`/admin/galeria/${a.id}`);
      }
    } catch (err) {
      flash(false, errorText(err, 'No se pudo guardar el álbum'));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length || !isEdit) return;
    setUploading({ done: 0, total: files.length });
    setMessage(null);
    try {
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const formData = new FormData();
        for (const f of batch) formData.append('files', await compressImage(f));
        await api.post(`/api/gallery/${albumId}/photos`, formData, { getToken, timeoutMs: 120_000 });
        setUploading({ done: Math.min(i + batch.length, files.length), total: files.length });
      }
      await reload();
      flash(true, `${files.length} foto(s) subida(s)`);
    } catch (err) {
      await reload().catch(() => {});
      flash(false, errorText(err, 'Error al subir las fotos'));
    } finally {
      setUploading(null);
    }
  }

  async function move(index: number, delta: number) {
    if (!album) return;
    const photos = [...album.photos];
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;
    [photos[index], photos[target]] = [photos[target], photos[index]];
    setAlbum({ ...album, photos }); // optimista
    try {
      const a = await api.patch<GalleryAlbum>(
        `/api/gallery/${album.id}/photos/order`,
        { photoIds: photos.map((p) => p.id) },
        { getToken },
      );
      setAlbum(a);
    } catch (err) {
      flash(false, errorText(err, 'No se pudo reordenar'));
      await reload();
    }
  }

  async function setCover(photo: GalleryPhoto) {
    if (!album) return;
    setBusy(true);
    try {
      const a = await api.patch<GalleryAlbum>(`/api/gallery/${album.id}`, { coverPhotoId: photo.id }, { getToken });
      setAlbum(a);
      flash(true, 'Portada actualizada');
    } catch (err) {
      flash(false, errorText(err, 'No se pudo cambiar la portada'));
    } finally {
      setBusy(false);
    }
  }

  async function saveCaption(photo: GalleryPhoto, caption: string) {
    if ((photo.caption ?? '') === caption.trim()) return;
    try {
      await api.patch(`/api/gallery/photos/${photo.id}`, { caption: caption.trim() || null }, { getToken });
      setAlbum((a) =>
        a ? { ...a, photos: a.photos.map((p) => (p.id === photo.id ? { ...p, caption: caption.trim() || null } : p)) } : a,
      );
    } catch (err) {
      flash(false, errorText(err, 'No se pudo guardar la descripción de la foto'));
    }
  }

  async function confirmDeletePhoto() {
    if (!deletePhoto) return;
    setBusy(true);
    try {
      await api.delete(`/api/gallery/photos/${deletePhoto.id}`, { getToken });
      setDeletePhoto(null);
      await reload();
    } catch (err) {
      flash(false, errorText(err, 'No se pudo eliminar la foto'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-text-muted">Cargando…</p>;
  if (isEdit && !album) {
    return (
      <div className="card text-center py-12">
        <p className="text-text-muted mb-4">{message?.text ?? 'Álbum no encontrado'}</p>
        <Link href="/admin/galeria" className="btn btn-outline">Volver</Link>
      </div>
    );
  }

  const coverId = album?.cover?.id;
  const hasPhotos = (album?.photos.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`text-sm rounded-lg p-3 border ${
            message.ok ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          {message.ok ? '✓' : '⚠'} {message.text}
        </div>
      )}

      {/* ---------- Fotos (solo en edición) ---------- */}
      {isEdit && album && (
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary">
                Fotos ({album.photos.length})
              </h2>
              <p className="text-xs text-text-muted">
                Se optimizan automáticamente. La primera (o la marcada con ⭐) es la portada.
              </p>
            </div>
            <label className={`btn btn-primary cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading ? `Subiendo ${uploading.done}/${uploading.total}…` : '📤 Subir fotos'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={uploadPhotos} />
            </label>
          </div>

          {!hasPhotos ? (
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center text-text-muted">
              <div className="text-4xl mb-2 opacity-50">📷</div>
              Sube las fotos de la fiesta (puedes elegir varias a la vez).
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {album.photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`rounded-xl border overflow-hidden bg-white ${
                    photo.id === coverId ? 'border-primary border-2 ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={thumbUrl(photo.path)}
                      onError={(e) => fallbackToOriginal(e, photo.path)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {photo.id === coverId && (
                      <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                        PORTADA
                      </span>
                    )}
                    <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>
                  <div className="p-2 space-y-2">
                    <input
                      type="text"
                      defaultValue={photo.caption ?? ''}
                      maxLength={255}
                      placeholder="Descripción (opcional)"
                      className="input !py-1 !text-xs w-full"
                      onBlur={(e) => saveCaption(photo, e.target.value)}
                    />
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          className="w-7 h-7 rounded bg-surface hover:bg-gray-200 disabled:opacity-30 text-sm"
                          title="Mover antes"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === album.photos.length - 1}
                          className="w-7 h-7 rounded bg-surface hover:bg-gray-200 disabled:opacity-30 text-sm"
                          title="Mover después"
                        >
                          →
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setCover(photo)}
                          disabled={busy || photo.id === coverId}
                          className="w-7 h-7 rounded bg-surface hover:bg-brand-yellow/30 disabled:opacity-30 text-sm"
                          title="Usar como portada"
                        >
                          ⭐
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePhoto(photo)}
                          className="w-7 h-7 rounded bg-surface hover:bg-danger/15 text-sm"
                          title="Eliminar foto"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------- Datos del álbum ---------- */}
      <form onSubmit={save} className="card space-y-4">
        <h2 className="text-lg font-heading font-bold text-text-primary">Datos de la fiesta</h2>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Título <span className="text-danger">*</span>
          </label>
          <input
            className="input w-full"
            value={form.title}
            maxLength={150}
            placeholder="Ej. Cumpleaños de Sofía 🎂"
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Fecha de la fiesta</label>
            <input
              type="date"
              className="input w-full"
              value={form.eventDate}
              onChange={(e) => update('eventDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Lugar</label>
            <input
              className="input w-full"
              value={form.location}
              maxLength={150}
              placeholder="Ej. Queens, NY"
              onChange={(e) => update('location', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Descripción</label>
          <textarea
            className="input w-full min-h-[140px]"
            value={form.description}
            maxLength={10000}
            placeholder="Cuenta cómo fue la fiesta: temática, qué equipos llevaron, cómo se divirtieron los niños…"
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Productos usados en la fiesta ({form.productIds.length})
          </label>
          <p className="text-xs text-text-muted mb-2">
            El álbum aparecerá en la página de cada producto seleccionado.
          </p>
          <input
            type="search"
            className="input w-full mb-2 !py-2 text-sm"
            placeholder="Buscar producto…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {filteredProducts.length === 0 ? (
              <p className="p-3 text-sm text-text-muted">Sin productos</p>
            ) : (
              filteredProducts.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="text-sm text-text-primary">{p.title}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {isEdit && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.published}
              disabled={!hasPhotos}
              onChange={(e) => update('published', e.target.checked)}
            />
            <span className="text-sm text-text-primary">
              Publicado (visible en la web){!hasPhotos && ' — sube al menos una foto para publicar'}
            </span>
          </label>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear y continuar con las fotos →'}
          </button>
          <Link href="/admin/galeria" className="btn btn-outline">
            Volver
          </Link>
          {isEdit && album?.published && (
            <a href={`/galeria/${album.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              👁 Ver en la web
            </a>
          )}
        </div>
      </form>

      <ConfirmModal
        isOpen={deletePhoto !== null}
        title="Eliminar foto"
        message="La foto se eliminará del álbum y del servidor. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isDanger
        loading={busy}
        onConfirm={confirmDeletePhoto}
        onClose={() => setDeletePhoto(null)}
      />
    </div>
  );
}
