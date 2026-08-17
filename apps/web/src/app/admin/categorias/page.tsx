'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import type { CategoryItem } from '@/lib/types';

const EMOJI_OPTIONS = [
  '🎪', '⚡', '🪑', '🍿', '🏆', '🎁', '💦', '🐂',
  '🚂', '🎠', '🫧', '🎮', '🤖', '🍹', '🏃', '🎈',
  '🏰', '🛝', '🎨', '🎵', '🏎️', '🎯', '🎂', '⭐'
];

const GRADIENT_OPTIONS = [
  { label: 'Rosa & Amarillo', value: 'from-party-pink/20 to-brand-yellow/20' },
  { label: 'Azul & Celeste', value: 'from-primary/20 to-info/20' },
  { label: 'Amarillo & Rosa', value: 'from-brand-yellow/20 to-party-pink/20' },
  { label: 'Naranja & Amarillo', value: 'from-warning/20 to-brand-yellow/20' },
  { label: 'Celeste & Verde', value: 'from-info/20 to-success/20' },
  { label: 'Naranja & Azul', value: 'from-warning/20 to-primary/20' },
];

export default function AdminCategoriasPage() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    slug: '',
    nameEs: '',
    nameEn: '',
    emoji: '🎪',
    color: 'from-primary/20 to-party-pink/20',
    position: 0,
    isActive: true,
  });

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<CategoryItem[]>('/api/categories/admin', { getToken });
      setCategories(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleOpenCreate() {
    setEditingCategory(null);
    const nextPos = categories.length > 0 ? Math.max(...categories.map((c) => c.position)) + 1 : 1;
    setFormData({
      slug: '',
      nameEs: '',
      nameEn: '',
      emoji: '🎪',
      color: 'from-primary/20 to-party-pink/20',
      position: nextPos,
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat: CategoryItem) {
    setEditingCategory(cat);
    setFormData({
      slug: cat.slug,
      nameEs: cat.nameEs,
      nameEn: cat.nameEn ?? '',
      emoji: cat.emoji,
      color: cat.color,
      position: cat.position,
      isActive: cat.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      nameEs: name,
      // Auto-generar slug en creación si el usuario no lo ha modificado manualmente
      slug: editingCategory ? prev.slug : slugify(name),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nameEs.trim()) {
      setModalError('El nombre en español es obligatorio.');
      return;
    }
    if (!formData.slug.trim()) {
      setModalError('El slug es obligatorio.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      if (editingCategory) {
        await api.patch(`/api/categories/${editingCategory.id}`, formData, { getToken });
      } else {
        await api.post('/api/categories', formData, { getToken });
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Error al guardar categoría.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: CategoryItem) {
    if (cat.productCount && cat.productCount > 0) {
      alert(`⚠️ No puedes eliminar "${cat.nameEs}" porque tiene ${cat.productCount} producto(s) asignado(s). Cambia la categoría de los productos primero.`);
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${cat.nameEs}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/categories/${cat.id}`, { getToken });
      await loadCategories();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar la categoría.');
    }
  }

  const filtered = categories.filter(
    (c) =>
      c.nameEs.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-text-primary">
            🏷️ Gestión de Categorías
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Administra las categorías de productos disponibles en el catálogo y panel de administración.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn btn-primary text-sm font-semibold flex items-center gap-2"
        >
          <span>➕</span> Nueva Categoría
        </button>
      </div>

      {/* Filtro y Tabla */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <input
            type="search"
            placeholder="Buscar por nombre o slug..."
            className="input max-w-xs text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-xs text-text-muted">
            Total: <strong>{categories.length}</strong> categorías
          </span>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm">Cargando categorías…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Icono</th>
                  <th className="py-3 px-4">Nombre (Español)</th>
                  <th className="py-3 px-4">Name (English)</th>
                  <th className="py-3 px-4">Slug (Identificador)</th>
                  <th className="py-3 px-4 text-center">Orden</th>
                  <th className="py-3 px-4 text-center">Productos</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      No se encontraron categorías.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface/50 transition">
                      <td className="py-3 px-4">
                        <span className="text-2xl">{cat.emoji}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-text-primary">{cat.nameEs}</td>
                      <td className="py-3 px-4 text-text-muted">{cat.nameEn || '—'}</td>
                      <td className="py-3 px-4 font-mono text-xs text-primary bg-primary/5 px-2 py-1 rounded inline-block">
                        {cat.slug}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">{cat.position}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-surface border border-border text-text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                          {cat.productCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-success rounded-full" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1 text-text-muted hover:text-primary rounded text-base"
                            title="Editar categoría"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1 text-text-muted hover:text-danger rounded text-base transition-colors"
                            title="Eliminar categoría"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-border p-6 max-w-lg w-full shadow-large space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-heading font-bold text-text-primary">
                {editingCategory ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-lg"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-xs rounded-lg p-2.5">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Nombre (Español) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Ej: Pistas de Obstáculos"
                  value={formData.nameEs}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Name (English)
                </label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Ej: Obstacle Course"
                  value={formData.nameEn}
                  onChange={(e) => setFormData((p) => ({ ...p, nameEn: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Slug (Identificador) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="input text-sm font-mono"
                    placeholder="obstacle_course"
                    value={formData.slug}
                    onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Orden de aparición
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input text-sm"
                    value={formData.position}
                    onChange={(e) => setFormData((p) => ({ ...p, position: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Selector de Emoji */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Icono Emoji seleccionable: <span className="text-lg ml-1">{formData.emoji}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-surface rounded-xl border border-border max-h-28 overflow-y-auto">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, emoji: e }))}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition ${
                        formData.emoji === e ? 'bg-primary/20 border-2 border-primary scale-110' : 'hover:bg-gray-100'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Degradado de Color */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Estilo de degradado (Tarjeta de Inicio)
                </label>
                <select
                  className="input text-sm"
                  value={formData.color}
                  onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                >
                  {GRADIENT_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Switch de Activo */}
              <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                <div>
                  <p className="text-xs font-bold text-text-primary">Categoría Activa</p>
                  <p className="text-[11px] text-text-muted">Visible en los filtros del sitio público</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-success rounded-full transition relative">
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost text-xs"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5"
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
