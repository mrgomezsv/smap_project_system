'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Client } from '@/lib/types';

export interface ClientFormState {
  clientId: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCityStateZip: string;
  driverLicense: string;
}

export const EMPTY_CLIENT_FORM: ClientFormState = {
  clientId: null,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  clientCityStateZip: '',
  driverLicense: '',
};

interface ClientPickerProps {
  value: ClientFormState;
  onChange: (next: ClientFormState) => void;
  disabled?: boolean;
}

export function ClientPicker({ value, onChange, disabled }: ClientPickerProps) {
  const { getToken } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function setModeManual() {
    onChange(EMPTY_CLIENT_FORM);
    setSearch('');
    setResults([]);
    setError(null);
    setOpen(false);
  }

  function pickClient(c: Client) {
    onChange({
      clientId: c.id,
      clientName: c.name || value.clientName,
      clientEmail: c.email || value.clientEmail,
      clientPhone: c.phone || value.clientPhone || '',
      clientAddress: c.address || value.clientAddress || '',
      clientCityStateZip: c.cityStateZip || value.clientCityStateZip || '',
      driverLicense: c.driverLicense || value.driverLicense || '',
    });
    setOpen(false);
    setSearch('');
  }

  function runQuery(term: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const trimmed = term.trim();
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ items: Client[]; total: number }>(
          `/api/v2/clients?search=${encodeURIComponent(trimmed)}&take=20`,
          { getToken }
        );
        setResults(res.items || []);
        setOpen(true);
        setHighlight(0);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          setError('No se pudo buscar clientes.');
        }
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function handleSearchInput(next: string) {
    setSearch(next);
    runQuery(next);
  }

  const selected = value.clientId !== null;

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="block font-semibold text-text-primary text-xs sm:text-sm">
          🔍 Buscar Cliente Registrado (Google / Cuenta) o Crear Nuevo
        </label>
        {selected ? (
          <button
            type="button"
            onClick={setModeManual}
            disabled={disabled}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            ↩ Desvincular / Ingresar nuevo cliente
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="p-3.5 rounded-xl border border-success/40 bg-success/5 text-sm space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-bold text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
              Cliente Vinculado: {value.clientName || 'Sin Nombre'}
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
              ID #{value.clientId}
            </span>
          </div>
          <div className="text-text-muted text-xs flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
            <span>✉️ {value.clientEmail || '—'}</span>
            {value.clientPhone ? <span>📞 {value.clientPhone}</span> : null}
          </div>
          <div className="text-[11px] text-text-muted italic pt-1 border-t border-success/15">
            Los datos registrados fueron cargados. Si falta dirección u otros datos, puedes completarlos abajo.
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setOpen(true);
                else runQuery(search);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (open && results.length > 0 && results[highlight]) {
                    pickClient(results[highlight]);
                  }
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlight((prev) => (prev + 1) % Math.max(1, results.length));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlight((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              disabled={disabled}
              placeholder="Escribe para buscar cliente por nombre, email o teléfono..."
              className="input w-full pr-10 text-sm"
              autoComplete="off"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setResults([]);
                  setOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            ) : null}
          </div>

          {open ? (
            <div className="absolute z-40 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-white shadow-2xl scrollbar-thin">
              {loading ? (
                <div className="p-4 text-xs text-text-muted text-center flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Buscando clientes...
                </div>
              ) : error ? (
                <div className="p-3 text-xs text-danger">⚠️ {error}</div>
              ) : results.length === 0 ? (
                <div className="p-3.5 text-xs text-text-muted text-center">
                  No se encontraron clientes registrados con ese criterio. Puedes escribir los datos directamente en los campos inferiores.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((c, idx) => {
                    const contractsCount = c._count?.rentalContracts ?? 0;
                    const isGoogleUser = !!c.userId;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => pickClient(c)}
                          onMouseEnter={() => setHighlight(idx)}
                          className={[
                            'w-full text-left px-3.5 py-2.5 text-xs sm:text-sm transition flex items-center justify-between gap-3',
                            highlight === idx ? 'bg-primary/10' : 'hover:bg-surface-elevated',
                          ].join(' ')}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                              <span className="truncate">{c.name}</span>
                              {isGoogleUser ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-info/10 text-info border border-info/30">
                                  Cuenta Google / Firebase
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-text-muted/10 text-text-muted border border-border">
                                  Cliente Registrado
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-muted truncate">{c.email}</div>
                            {c.phone ? <div className="text-xs text-text-muted">📞 {c.phone}</div> : null}
                          </div>
                          <span className="text-[11px] font-medium text-primary shrink-0">
                            {contractsCount} contrato{contractsCount === 1 ? '' : 's'} →
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
