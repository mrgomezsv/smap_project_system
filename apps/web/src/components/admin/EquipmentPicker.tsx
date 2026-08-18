'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Product, ProductsListResponse } from '@/lib/types';

interface EquipmentPickerProps {
  value: string;
  onChange: (equipment: string, suggestedPrice?: number) => void;
  disabled?: boolean;
}

export function EquipmentPicker({ value, onChange, disabled }: EquipmentPickerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<ProductsListResponse>('/api/products?take=100');
        setProducts(res.items || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  function toggleProduct(prod: Product) {
    const isSelected = selectedIds.includes(prod.id);
    let nextIds: number[];
    if (isSelected) {
      nextIds = selectedIds.filter((id) => id !== prod.id);
    } else {
      nextIds = [...selectedIds, prod.id];
    }
    setSelectedIds(nextIds);

    const selectedProducts = products.filter((p) => nextIds.includes(p.id));
    const titles = selectedProducts.map((p) => p.title).join(' + ');

    let totalPrice = 0;
    for (const p of selectedProducts) {
      if (p.price != null && Number.isFinite(Number(p.price))) {
        totalPrice += Number(p.price);
      }
    }

    onChange(titles, totalPrice > 0 ? totalPrice : undefined);
  }

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-text-primary text-sm">
          Equipo / Inflable Contratado *
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          {isOpen ? '▲ Ocultar catálogo' : '🎪 Seleccionar de catálogo'}
        </button>
      </div>

      {/* Selected tags */}
      {selectedProducts.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 p-2 bg-primary/5 border border-primary/20 rounded-xl">
          {selectedProducts.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/30"
            >
              🏰 {p.title}
              {p.price ? <span className="opacity-75">(${Number(p.price).toFixed(2)})</span> : null}
              <button
                type="button"
                onClick={() => toggleProduct(p)}
                className="ml-1 text-primary hover:text-danger font-bold text-xs"
                title="Quitar"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Dropdown catalog */}
      {isOpen ? (
        <div className="p-3 bg-surface-elevated border border-border rounded-xl space-y-3 shadow-md max-h-72 overflow-y-auto">
          <input
            type="text"
            placeholder="Buscar por nombre o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full text-xs"
          />

          {loading ? (
            <div className="text-center py-4 text-xs text-text-muted">Cargando productos…</div>
          ) : error ? (
            <div className="text-xs text-danger p-2">⚠ {error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-4 text-xs text-text-muted">No hay productos coincidentes.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={[
                      'flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition select-none',
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'bg-white border-border hover:bg-surface text-text-primary',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(p)}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary shrink-0"
                    />
                    <div className="truncate flex-1">
                      <div className="truncate font-medium">{p.title}</div>
                      <div className="text-[10px] text-text-muted truncate">
                        {p.category} {p.dimensions ? `· ${p.dimensions}` : ''}
                      </div>
                    </div>
                    {p.price ? (
                      <span className="font-bold text-xs shrink-0">${Number(p.price).toFixed(2)}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Manual editable text field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Ej. Castillo Inflable Princess + Máquina de Palomitas"
        className="input w-full"
      />
      <p className="text-[11px] text-text-muted">
        Puedes seleccionar uno o varios del catálogo o redactar la descripción libremente.
      </p>
    </div>
  );
}
