'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import { compressImage } from '@/lib/image-compress';
import { CATEGORY_LABELS, type Category, type Product } from '@/lib/types';

interface ProductFormProps {
  initial?: Product;
  mode: 'create' | 'edit';
}

const CATEGORIES: Category[] = [
  'option1',
  'option2',
  'option3',
  'option4',
  'option5',
  'option6',
  'option7',
  'toros_mecanicos',
  'trenes_electricos',
  'kiddie_ride',
  'maquina_espuma',
  'game_trailer',
  'robots_led',
  'shots_carts',
];

interface FormData {
  title: string;
  description: string;
  price: string;
  category: Category;
  publicated: boolean;
  dimensions: string;
  space: string;
  circuits: string;
  youtubeUrl: string;
  img: string;
  img1: string;
  img2: string;
  img3: string;
  img4: string;
  img5: string;
}

const EMPTY: FormData = {
  title: '',
  description: '',
  price: '',
  category: 'option1',
  publicated: false,
  dimensions: '',
  space: '',
  circuits: '',
  youtubeUrl: '',
  img: '',
  img1: '',
  img2: '',
  img3: '',
  img4: '',
  img5: '',
};

export function ProductForm({ initial, mode }: ProductFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const tPh = useTranslations('placeholders');
  const [data, setData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setData({
        title: initial.title,
        description: initial.description ?? '',
        price: initial.price?.toString() ?? '',
        category: initial.category,
        publicated: initial.publicated,
        dimensions: initial.dimensions ?? '',
        space: initial.space ?? '',
        circuits: initial.circuits ?? '',
        youtubeUrl: initial.youtubeUrl ?? '',
        img: initial.img ?? '',
        img1: initial.img1 ?? '',
        img2: initial.img2 ?? '',
        img3: initial.img3 ?? '',
        img4: initial.img4 ?? '',
        img5: initial.img5 ?? '',
      });
    }
  }, [initial]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!data.title.trim()) next.title = 'El título es obligatorio';
    if (data.price && Number.isNaN(Number(data.price))) next.price = 'Precio inválido';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Lista con todas las imágenes actuales no vacías y no por defecto
  const currentImages = [data.img, data.img1, data.img2, data.img3, data.img4, data.img5].filter(
    (img) => img && !img.includes('default_product_image')
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const newImagePaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        // Comprimir imagen si excede el tamaño/resolución ideal para web
        const file = await compressImage(rawFile);
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post<{ path: string }>('/api/upload/product-image', formData, {
          getToken,
          timeoutMs: 30_000,
        });
        if (res?.path) {
          // Extraer nombre de archivo si viene la ruta completa o usar res.path
          const filename = res.path.split('/').pop() || res.path;
          newImagePaths.push(filename);
        }
      }

      // Asignar imágenes subidas a las ranuras disponibles (img principal + img1..img5)
      const allImages = [...currentImages, ...newImagePaths];
      setData((prev) => ({
        ...prev,
        img: allImages[0] ?? '',
        img1: allImages[1] ?? '',
        img2: allImages[2] ?? '',
        img3: allImages[3] ?? '',
        img4: allImages[4] ?? '',
        img5: allImages[5] ?? '',
      }));
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Error al subir la imagen.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  }

  function removeImage(indexToRemove: number) {
    const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
    setData((prev) => ({
      ...prev,
      img: updatedImages[0] ?? '',
      img1: updatedImages[1] ?? '',
      img2: updatedImages[2] ?? '',
      img3: updatedImages[3] ?? '',
      img4: updatedImages[4] ?? '',
      img5: updatedImages[5] ?? '',
    }));
  }

  function setPrimaryImage(indexToPrimary: number) {
    if (indexToPrimary === 0 || indexToPrimary >= currentImages.length) return;
    const selected = currentImages[indexToPrimary];
    const remaining = currentImages.filter((_, idx) => idx !== indexToPrimary);
    const updatedImages = [selected, ...remaining];

    setData((prev) => ({
      ...prev,
      img: updatedImages[0] ?? '',
      img1: updatedImages[1] ?? '',
      img2: updatedImages[2] ?? '',
      img3: updatedImages[3] ?? '',
      img4: updatedImages[4] ?? '',
      img5: updatedImages[5] ?? '',
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      title: data.title,
      description: data.description || undefined,
      price: data.price ? Number(data.price) : undefined,
      category: data.category,
      publicated: data.publicated,
      dimensions: data.dimensions || undefined,
      space: data.space || undefined,
      circuits: data.circuits || undefined,
      youtubeUrl: data.youtubeUrl || undefined,
      img: data.img || undefined,
      img1: data.img1 || undefined,
      img2: data.img2 || undefined,
      img3: data.img3 || undefined,
      img4: data.img4 || undefined,
      img5: data.img5 || undefined,
    };

    try {
      if (mode === 'create') {
        await api.post('/api/products', payload, { getToken });
      } else if (initial) {
        await api.patch(`/api/products/${initial.id}`, payload, { getToken });
      }
      router.push('/admin/productos');
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {errorMsg}
        </div>
      )}

      {/* SECCIÓN DE IMÁGENES */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-text-primary">Imágenes del producto</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Sube hasta 6 imágenes para mostrar en la galería. La primera imagen será la principal.
            </p>
          </div>
          <label className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-2">
            <span>{uploading ? '⏳ Subiendo…' : '📁 Subir imágenes'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading || currentImages.length >= 6}
              className="hidden"
            />
          </label>
        </div>

        {currentImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {currentImages.map((imgName, index) => (
              <div
                key={`${imgName}-${index}`}
                className={`relative aspect-square rounded-xl border overflow-hidden bg-gray-100 group shadow-xs ${
                  index === 0 ? 'border-primary border-2 ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <img
                  src={`/media/${imgName}`}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                    Principal
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="p-1.5 bg-white text-text-primary rounded-lg text-xs hover:bg-gray-100 font-semibold"
                      title="Establecer como principal"
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                    title="Eliminar imagen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-surface">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm font-semibold text-text-primary">No hay imágenes seleccionadas</p>
            <p className="text-xs text-text-muted mt-1 mb-4">
              Formato recomendado: JPG, PNG o WebP (Máx 10MB por archivo)
            </p>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-heading font-bold text-text-primary">Información básica</h2>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Título <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="input"
            value={data.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Descripción</label>
          <textarea
            rows={4}
            className="input resize-none"
            value={data.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Categoría</label>
            <select
              className="input"
              value={data.category}
              onChange={(e) => update('category', e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Precio ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={data.price}
              onChange={(e) => update('price', e.target.value)}
            />
            {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
          <div>
            <p className="font-medium text-text-primary">Publicado</p>
            <p className="text-xs text-text-muted">Visible en el sitio público</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data.publicated}
              onChange={(e) => update('publicated', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-checked:bg-success rounded-full transition relative">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-heading font-bold text-text-primary">Especificaciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Dimensiones</label>
            <input
              type="text"
              className="input"
              placeholder={tPh('productDimensions')}
              value={data.dimensions}
              onChange={(e) => update('dimensions', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Espacio</label>
            <input
              type="text"
              className="input"
              placeholder={tPh('productSpace')}
              value={data.space}
              onChange={(e) => update('space', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Circuitos</label>
            <input
              type="text"
              className="input"
              placeholder={tPh('productCircuits')}
              value={data.circuits}
              onChange={(e) => update('circuits', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">YouTube URL</label>
          <input
            type="url"
            className="input"
            placeholder={tPh('productYoutube')}
            value={data.youtubeUrl}
            onChange={(e) => update('youtubeUrl', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost"
          disabled={saving || uploading}
        >
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary px-6" disabled={saving || uploading}>
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
