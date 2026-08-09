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

  useEffect(() => {
    if (value.clientId) {
      setOpen(false);
    }
  }, [value.clientId]);

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
      clientName: c.name ?? value.clientName,
      clientEmail: c.email ?? value.clientEmail,
      clientPhone: c.phone ?? value.clientPhone,
      clientAddress: c.address ?? value.clientAddress,
      clientCityStateZip: c.cityStateZip ?? value.clientCityStateZip,
      driverLicense: c.driverLicense ?? value.driverLicense,
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
    }, 250);
  }

  function handleSearchInput(next: string) {
    setSearch(next);
    runQuery(next);
  }

  const selected = value.clientId !== null;

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="block font-semibold">Cliente</label>
        {selected ? (
          <button
            type="button"
            onClick={setModeManual}
            disabled={disabled}
            className="text-xs text-primary hover:underline"
          >
            ↩ Volver a cliente nuevo / manual
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-sm space-y-1">
          <div className="font-semibold text-text-primary">{value.clientName || 'Cliente seleccionado'}</div>
          <div className="text-text-muted">{value.clientEmail}</div>
          {value.clientPhone ? (
            <div className="text-text-muted">📞 {value.clientPhone}</div>
          ) : null}
          <div className="text-xs text-primary font-medium">
            ID cliente: <span className="font-mono">#{value.clientId}</span>
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
            }}
            disabled={disabled}
            placeholder="Buscar cliente por nombre, email o teléfono…"
            className="input w-full"
            autoComplete="off"
          />
          {open ? (
            <div className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-white shadow-large">
              {loading ? (
                <div className="p-3 text-sm text-text-muted">Buscando clientes…</div>
              ) : error ? (
                <div className="p-3 text-sm text-danger">⚠ {error}</div>
              ) : results.length === 0 ? (
                <div className="p-3 text-sm text-text-muted">
                  Sin resultados. Completa los datos abajo para crear un cliente nuevo.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((c, idx) => {
                    const contractsCount = c._count?.rentalContracts ?? 0;
                    const isFirebase = !!c.userId;
                    const isManual = c.source === 'manual';
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => pickClient(c)}
                          onMouseEnter={() => setHighlight(idx)}
                          className={[
                            'w-full text-left px-3 py-2 text-sm transition',
                            highlight === idx ? 'bg-primary/5' : 'hover:bg-surface-elevated',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-text-primary">{c.name}</div>
                            <div className="flex items-center gap-1 shrink-0">
                              {isFirebase ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-info/10 text-info border border-info/30">
                                  Firebase
                                </span>
                              ) : null}
                              {isManual ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-border">
                                  Manual
                                </span>
                              ) : null}
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                                {contractsCount} contrato{contractsCount === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-text-muted truncate">{c.email}</div>
                          <div className="text-xs text-text-muted truncate">
                            {c.phone ? `📞 ${c.phone}` : '—'}
                          </div>
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
      <p className="text-[11px] text-text-muted">
        Selecciona un cliente existente para autocompletar sus datos, o captura uno nuevo abajo.
      </p>
    </div>
  );
}
