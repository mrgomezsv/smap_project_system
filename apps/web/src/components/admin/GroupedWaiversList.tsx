'use client';

import { useState, useMemo } from 'react';
import type { Waiver } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';

interface GroupedWaiversListProps {
  waivers: Waiver[];
  emptyMessage: string;
  onDeleteSelected: (waivers: Waiver[]) => void;
  onResendEmail: (waiver: Waiver) => void;
  isSendingEmail: (qrCode: string) => boolean;
  onSendWhatsApp: (waiver: Waiver) => void;
  onDeleteSingle: (waiver: Waiver) => void;
}

export function GroupedWaiversList({
  waivers,
  emptyMessage,
  onDeleteSelected,
  onResendEmail,
  isSendingEmail,
  onSendWhatsApp,
  onDeleteSingle,
}: GroupedWaiversListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedWaivers, setSelectedWaivers] = useState<Set<string | number>>(new Set());

  // Agrupar waivers por email del usuario (usando un fallback si no tiene email)
  const groupedWaivers = useMemo(() => {
    const groups: Record<string, { email: string; name: string; waivers: Waiver[] }> = {};
    for (const w of waivers) {
      const key = w.userEmail?.toLowerCase() || w.userName?.toLowerCase() || 'Desconocido';
      if (!groups[key]) {
        groups[key] = {
          email: w.userEmail || 'Sin correo',
          name: w.userName || 'Sin nombre',
          waivers: [],
        };
      }
      groups[key].waivers.push(w);
    }
    // Ordenar por nombre del grupo alfabéticamente
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [waivers]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleWaiverSelection = (id: string | number) => {
    setSelectedWaivers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroupSelection = (groupWaivers: Waiver[]) => {
    const allSelectedInGroup = groupWaivers.every((w) => selectedWaivers.has(w.id));
    setSelectedWaivers((prev) => {
      const next = new Set(prev);
      if (allSelectedInGroup) {
        groupWaivers.forEach((w) => next.delete(w.id));
      } else {
        groupWaivers.forEach((w) => next.add(w.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedWaivers(new Set());

  if (waivers.length === 0) {
    return (
      <div className="card p-12 text-center text-text-muted border border-border shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  const selectedRows = waivers.filter((w) => selectedWaivers.has(w.id));

  return (
    <div className="space-y-4">
      {/* Barra de Acciones Masivas */}
      {selectedRows.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between sticky top-16 z-20 shadow-sm backdrop-blur-md">
          <span className="text-sm text-text-primary font-medium">
            {selectedRows.length} waiver{selectedRows.length === 1 ? '' : 's'} seleccionado{selectedRows.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="text-xs font-semibold text-text-muted hover:text-text-primary"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onDeleteSelected(selectedRows);
                clearSelection();
              }}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition flex items-center gap-1.5 shadow-sm"
            >
              🗑️ Borrar seleccionados
            </button>
          </div>
        </div>
      )}

      {/* Lista de Acordeones */}
      <div className="space-y-3">
        {groupedWaivers.map((group) => {
          const groupKey = group.email;
          const isExpanded = expandedGroups.has(groupKey);
          const allSelected = group.waivers.every((w) => selectedWaivers.has(w.id));
          const someSelected = group.waivers.some((w) => selectedWaivers.has(w.id)) && !allSelected;

          return (
            <div key={groupKey} className="card p-0 overflow-hidden border border-border shadow-sm">
              {/* Cabecera del Grupo */}
              <div
                className={`px-4 py-4 flex items-center justify-between cursor-pointer transition hover:bg-surface select-none ${isExpanded ? 'bg-surface border-b border-border' : ''}`}
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm md:text-base leading-tight">
                      {group.name}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {group.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                    {group.waivers.length} Waiver{group.waivers.length !== 1 ? 's' : ''}
                  </span>
                  <div className="text-text-muted transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Contenido Expandido */}
              {isExpanded && (
                <div className="bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-border">
                        <tr>
                          <th className="w-12 py-2 px-4">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected; }}
                              onChange={() => toggleGroupSelection(group.waivers)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                              aria-label="Seleccionar todos en este grupo"
                            />
                          </th>
                          <th className="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">QR</th>
                          <th className="py-2 px-4 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Acompañantes</th>
                          <th className="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Fecha Registro</th>
                          <th className="py-2 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Estado</th>
                          <th className="py-2 px-4 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.waivers.map((w) => {
                          const isSelected = selectedWaivers.has(w.id);
                          return (
                            <tr key={w.id} className={`border-b border-border last:border-b-0 hover:bg-surface transition ${isSelected ? 'bg-primary/5' : ''}`}>
                              <td className="py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleWaiverSelection(w.id)}
                                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <code className="font-mono font-bold text-primary text-sm">{w.qrCode}</code>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-semibold text-sm text-text-primary">
                                  {w.relatives?.length ?? 0}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-text-muted text-xs">
                                  {new Date(w.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {w.status === 'ACTIVE' ? (
                                  <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-success rounded-full" />
                                    Activo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-gray-100 text-text-muted text-xs font-semibold px-2 py-0.5 rounded-full">
                                    Inactivo
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <a
                                    href={`${API_BASE_URL}/api/v2/waiver/download/${w.qrCode}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition border border-transparent hover:border-primary/20"
                                    title="Descargar PDF"
                                  >
                                    📄
                                  </a>
                                  <button
                                    onClick={() => onResendEmail(w)}
                                    disabled={isSendingEmail(w.qrCode)}
                                    className="p-2 rounded-xl text-text-muted hover:text-info hover:bg-info/10 transition border border-transparent hover:border-info/20 disabled:opacity-50"
                                    title="Reenviar Email"
                                  >
                                    ✉️
                                  </button>
                                  <button
                                    onClick={() => onSendWhatsApp(w)}
                                    className="p-2 rounded-xl text-text-muted hover:text-success hover:bg-success/10 transition border border-transparent hover:border-success/20"
                                    title="Reenviar por WhatsApp"
                                  >
                                    💬
                                  </button>
                                  <button
                                    onClick={() => onDeleteSingle(w)}
                                    className="p-2 rounded-xl text-text-muted hover:text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-200"
                                    title="Borrar Waiver"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
