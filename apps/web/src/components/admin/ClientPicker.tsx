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
        <label className="block font-semibold text-text-primary text-sm">
          🔍 Buscar Cliente Registrado (Google / Cuenta) o Crear Nuevo
        </label>
        {selected ? (
          <button
            type="button"
            onClick={setModeManual}
            disabled={disabled}
            className="text-xs text-primary hover:underline font-medium"
          >
            ↩ Desvincular cliente / ingresar manualmente
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="p-3 rounded-xl border border-success/40 bg-success/5 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <div className="font-bold text-text-primary">
              ✓ Cliente Seleccionado: {value.clientName || 'Sin Nombre'}
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
              Cliente #{value.clientId}
            </span>
          </div>
          <div className="text-text-muted text-xs">Email: {value.clientEmail || '—'}</div>
          {value.clientPhone ? (
            <div className="text-text-muted text-xs">Teléfono: {value.clientPhone}</div>
          ) : null}
          <div className="text-[11px] text-text-muted italic pt-1">
            Los datos conocidos han sido cargados. Puedes modificar o agregar cualquier dato faltante en los campos inferiores.
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
              else runQuery(search);
            }}
            disabled={disabled}
            placeholder="Escribe para buscar por nombre, correo electrónico o teléfono..."
            className="input w-full"
            autoComplete="off"
          />
          {open ? (
            <div className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-white shadow-2xl">
              {loading ? (
                <div className="p-3 text-sm text-text-muted text-center">Buscando clientes...</div>
              ) : error ? (
                <div className="p-3 text-sm text-danger">⚠ {error}</div>
              ) : results.length === 0 ? (
                <div className="p-3 text-sm text-text-muted text-center">
                  No se encontraron clientes registrados con ese criterio. Puedes llenar los campos manualmente abajo.
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
                            'w-full text-left px-3.5 py-2.5 text-sm transition flex items-center justify-between gap-3',
                            highlight === idx ? 'bg-primary/10' : 'hover:bg-surface-elevated',
                          ].join(' ')}
                        >
                          <div>
                            <div className="font-semibold text-text-primary flex items-center gap-2">
                              {c.name}
                              {isGoogleUser ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-info/10 text-info border border-info/30">
                                  Cuenta Google / Firebase
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-text-muted/10 text-text-muted border border-border">
                                  Cliente Registrado
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-muted">{c.email}</div>
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
