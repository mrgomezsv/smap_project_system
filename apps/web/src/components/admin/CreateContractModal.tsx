'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import type { ContractCreateResponse } from '@/lib/types';
import { ClientPicker, EMPTY_CLIENT_FORM, type ClientFormState } from '@/components/admin/ClientPicker';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ContractFormState {
  client: ClientFormState;
  eventDate: string;
  startTime: string;
  endTime: string;
  equipment: string;
  groundType: string;
  price: string;
  deposit: string;
  hasDeposit: boolean;
  notes: string;
}

const EMPTY_CONTRACT_FORM: ContractFormState = {
  client: { ...EMPTY_CLIENT_FORM },
  eventDate: '',
  startTime: '10:00 AM',
  endTime: '06:00 PM',
  equipment: '',
  groundType: 'Grass',
  price: '',
  deposit: '',
  hasDeposit: false,
  notes: '',
};

const TIME_OPTIONS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
  '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
];

export function CreateContractModal({ isOpen, onClose, onSuccess }: CreateContractModalProps) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState<ContractFormState>(EMPTY_CONTRACT_FORM);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ContractCreateResponse | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData(EMPTY_CONTRACT_FORM);
      setErrorMsg(null);
      setResult(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function setClient(next: ClientFormState) {
    setFormData((prev) => ({ ...prev, client: next }));
  }

  function setField<K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const priceNum = Number(formData.price || 0);
  const depositNum = formData.hasDeposit ? Number(formData.deposit || 0) : 0;
  const balanceDue = Math.max(0, priceNum - depositNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    const client = formData.client;
    const payload: Record<string, unknown> = {
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      clientPhone: client.clientPhone || undefined,
      clientAddress: client.clientAddress,
      clientCityStateZip: client.clientCityStateZip || undefined,
      driverLicense: client.driverLicense || undefined,
      eventDate: formData.eventDate || undefined,
      startTime: formData.startTime,
      endTime: formData.endTime,
      equipment: formData.equipment,
      groundType: formData.groundType,
      price: formData.price ? Number(formData.price) : undefined,
      deposit: formData.hasDeposit && formData.deposit ? Number(formData.deposit) : 0,
      notes: formData.notes || undefined,
    };
    if (client.clientId) {
      payload.clientId = client.clientId;
    }

    try {
      const res = await api.post<ContractCreateResponse>('/api/v2/contracts', payload, { getToken });
      setResult(res);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error al crear el contrato.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-xl font-bold"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="text-2xl font-heading font-extrabold text-text-primary mb-1">
          📝 Crear y Enviar Contrato de Renta
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Ingresa la información acordada en la llamada para enviar el contrato por correo al cliente.
        </p>

        {errorMsg ? (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-medium">
            {errorMsg}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4 text-center py-6">
            <div className="text-5xl">{result.emailSent ? '🎉' : '📄'}</div>
            <h3 className="text-xl font-bold text-text-primary">
              {result.emailSent
                ? '¡Contrato creado y enviado por email!'
                : 'Contrato creado. El email no se pudo enviar.'}
            </h3>
            <p className="text-sm text-text-muted">
              {result.emailSent
                ? 'Le enviamos un correo al cliente con el botón para firmar. También puedes copiar el enlace directo a continuación:'
                : 'Comparte manualmente el enlace de firma con el cliente. Revisa la configuración SMTP si el problema persiste.'}
            </p>
            <div className="p-3 bg-surface-elevated border border-border rounded-xl font-mono text-xs break-all select-all">
              {result.signUrl}
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.signUrl);
                }}
                className="btn btn-secondary text-sm"
              >
                📋 Copiar enlace
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary text-sm">
                Aceptar y cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <ClientPicker value={formData.client} onChange={setClient} disabled={loading} />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={formData.client.clientName}
                  onChange={(e) => setClient({ ...formData.client, clientName: e.target.value })}
                  placeholder="Ej. John Doe"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.client.clientEmail}
                  onChange={(e) => setClient({ ...formData.client, clientEmail: e.target.value })}
                  placeholder="cliente@email.com"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono Fijo / Celular</label>
                <input
                  type="text"
                  value={formData.client.clientPhone}
                  onChange={(e) => setClient({ ...formData.client, clientPhone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Licencia de Conducir (#)</label>
                <input
                  type="text"
                  value={formData.client.driverLicense}
                  onChange={(e) => setClient({ ...formData.client, driverLicense: e.target.value })}
                  placeholder="DL-1234567"
                  className="input w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Dirección de Entrega *</label>
                <input
                  type="text"
                  required
                  value={formData.client.clientAddress}
                  onChange={(e) => setClient({ ...formData.client, clientAddress: e.target.value })}
                  placeholder="Street Address"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ciudad, Estado y Zip</label>
                <input
                  type="text"
                  value={formData.client.clientCityStateZip}
                  onChange={(e) => setClient({ ...formData.client, clientCityStateZip: e.target.value })}
                  placeholder="New York, NY 10001"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fecha del Evento</label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setField('eventDate', e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hora de Inicio</label>
                <select
                  value={formData.startTime}
                  onChange={(e) => setField('startTime', e.target.value)}
                  className="input w-full"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Hora de Finalización</label>
                <select
                  value={formData.endTime}
                  onChange={(e) => setField('endTime', e.target.value)}
                  className="input w-full"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Equipo / Inflable Contratado *</label>
                <input
                  type="text"
                  required
                  value={formData.equipment}
                  onChange={(e) => setField('equipment', e.target.value)}
                  placeholder="Ej. Barbie Bounce House & Cotton Candy Machine"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Precio Acordado ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setField('price', e.target.value)}
                  placeholder="350.00"
                  className="input w-full"
                />
              </div>

              <div className="md:col-span-2 p-3 bg-surface-elevated rounded-xl border border-border space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.hasDeposit}
                    onChange={(e) => {
                      setField('hasDeposit', e.target.checked);
                      if (!e.target.checked) setField('deposit', '');
                    }}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <span className="font-bold text-text-primary text-sm">¿El cliente dio anticipo?</span>
                </label>

                {formData.hasDeposit ? (
                  <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Monto del Anticipo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.deposit}
                        onChange={(e) => setField('deposit', e.target.value)}
                        placeholder="Ej. 50.00"
                        className="input w-full text-sm"
                      />
                    </div>
                    <div className="p-2.5 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg">
                      <span className="block text-xs text-text-muted">Saldo Restante a Pagar al Entregar:</span>
                      <span className="text-base font-extrabold text-primary">${balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Notas Especiales / Instrucciones</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Instrucciones de acceso, notas de entrega, etc."
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-secondary px-5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary px-6"
              >
                {loading ? 'Creando…' : '📩 Crear y Enviar Contrato'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
