'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
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
};

export function ProductForm({ initial, mode }: ProductFormProps) {
  const router = useRouter();
  const tPh = useTranslations('placeholders');
  const [data, setData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);
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
    };

    try {
      if (mode === 'create') {
        await api.post('/api/products', payload);
      } else if (initial) {
        await api.patch(`/api/products/${initial.id}`, payload);
      }
      router.push('/productos');
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
          disabled={saving}
        >
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary px-6" disabled={saving}>
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
