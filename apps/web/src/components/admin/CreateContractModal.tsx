'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';
import type { ContractCreateResponse } from '@/lib/types';
import { ClientPicker, EMPTY_CLIENT_FORM, type ClientFormState } from '@/components/admin/ClientPicker';
import { EquipmentPicker } from '@/components/admin/EquipmentPicker';

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

const GROUND_OPTIONS = [
  { value: 'Grass', label: '🌱 Césped / Grass' },
  { value: 'Concrete', label: '🧱 Concreto / Pavimento' },
  { value: 'Turf', label: '🌿 Césped Artificial / Turf' },
  { value: 'Indoor', label: '🏠 Interior / Indoor Gym' },
  { value: 'Dirt', label: '🏜️ Tierra / Dirt' },
];

export function CreateContractModal({ isOpen, onClose, onSuccess }: CreateContractModalProps) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState<ContractFormState>(EMPTY_CONTRACT_FORM);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ContractCreateResponse | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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

  function handleEquipmentChange(equipment: string, suggestedPrice?: number) {
    setFormData((prev) => ({
      ...prev,
      equipment,
      price: suggestedPrice !== undefined ? String(suggestedPrice) : prev.price,
    }));
  }

  const priceNum = Number(formData.price || 0);
  const depositNum = formData.hasDeposit ? Number(formData.deposit || 0) : 0;
  const balanceDue = Math.max(0, priceNum - depositNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);

    // Explicit validation
    const client = formData.client;
    if (!client.clientName.trim()) {
      setErrorMsg('Por favor ingresa el Nombre del Cliente.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!client.clientEmail.trim() || !client.clientEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un Correo Electrónico válido para el cliente.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!client.clientAddress.trim()) {
      setErrorMsg('Por favor ingresa la Dirección de Entrega.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!formData.equipment.trim()) {
      setErrorMsg('Por favor selecciona o ingresa el Equipo / Inflable Contratado.');
      scrollContainerRef.current?.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const payload: Record<string, unknown> = {
      clientName: client.clientName.trim(),
      clientEmail: client.clientEmail.trim().toLowerCase(),
      clientPhone: client.clientPhone.trim() || undefined,
      clientAddress: client.clientAddress.trim(),
      clientCityStateZip: client.clientCityStateZip.trim() || undefined,
      driverLicense: client.driverLicense.trim() || undefined,
      eventDate: formData.eventDate || undefined,
      startTime: formData.startTime,
      endTime: formData.endTime,
      equipment: formData.equipment.trim(),
      groundType: formData.groundType,
      price: formData.price ? Number(formData.price) : undefined,
      deposit: formData.hasDeposit && formData.deposit ? Number(formData.deposit) : 0,
      notes: formData.notes.trim() || undefined,
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
        setErrorMsg('Error al crear el contrato. Revisa la conexión con la API.');
      }
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm overflow-hidden animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-text-primary flex items-center gap-2">
              📝 Crear y Enviar Contrato de Renta
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Genera y envía el contrato de alquiler por correo electrónico para firma digital.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border transition font-bold text-sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Success State */}
        {result ? (
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="text-5xl">{result.emailSent ? '🎉' : '📄'}</div>
            <h3 className="text-xl font-bold text-text-primary">
              {result.emailSent
                ? '¡Contrato creado y enviado por email!'
                : 'Contrato creado. El email no se pudo enviar.'}
            </h3>
            <p className="text-sm text-text-muted max-w-md">
              {result.emailSent
                ? 'Le enviamos un correo al cliente con el botón para firmar. También puedes copiar el enlace directo a continuación:'
                : 'Comparte manualmente el enlace de firma con el cliente:'}
            </p>
            <div className="w-full max-w-lg p-3 bg-surface-elevated border border-border rounded-xl font-mono text-xs break-all select-all text-text-primary">
              {result.signUrl}
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.signUrl);
                }}
                className="btn btn-secondary text-sm px-5"
              >
                📋 Copiar enlace
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary text-sm px-5">
                Aceptar y cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable Form Body */}
            <div
              ref={scrollContainerRef}
              className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 scrollbar-thin text-sm"
            >
              {errorMsg ? (
                <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-medium flex items-center gap-2 animate-shake">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              <form id="create-contract-form" onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* 1. Client Search and Pick */}
                <div className="p-4 bg-surface-elevated rounded-xl border border-border space-y-3">
                  <ClientPicker value={formData.client} onChange={setClient} disabled={loading} />
                </div>

                {/* 2. Client Details Grid */}
                <div className="p-4 bg-surface-elevated rounded-xl border border-border space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                    👤 Datos del Cliente
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Nombre del Cliente <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.client.clientName}
                        onChange={(e) => setClient({ ...formData.client, clientName: e.target.value })}
                        placeholder="Ej. John Doe"
                        className="input w-full text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Correo Electrónico <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.client.clientEmail}
                        onChange={(e) => setClient({ ...formData.client, clientEmail: e.target.value })}
                        placeholder="cliente@email.com"
                        className="input w-full text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Teléfono Fijo / Celular
                      </label>
                      <input
                        type="text"
                        value={formData.client.clientPhone}
                        onChange={(e) => setClient({ ...formData.client, clientPhone: e.target.value })}
                        placeholder="(555) 000-0000"
                        className="input w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Licencia de Conducir (#)
                      </label>
                      <input
                        type="text"
                        value={formData.client.driverLicense}
                        onChange={(e) => setClient({ ...formData.client, driverLicense: e.target.value })}
                        placeholder="DL-1234567"
                        className="input w-full text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Dirección de Entrega <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.client.clientAddress}
                        onChange={(e) => setClient({ ...formData.client, clientAddress: e.target.value })}
                        placeholder="Street Address, Apt, Suite"
                        className="input w-full text-sm"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Ciudad, Estado y Código Postal
                      </label>
                      <input
                        type="text"
                        value={formData.client.clientCityStateZip}
                        onChange={(e) => setClient({ ...formData.client, clientCityStateZip: e.target.value })}
                        placeholder="New York, NY 10001"
                        className="input w-full text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Event Details & Equipment */}
                <div className="p-4 bg-surface-elevated rounded-xl border border-border space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                    🎪 Detalles del Evento y Equipo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Fecha del Evento
                      </label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setField('eventDate', e.target.value)}
                        className="input w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Tipo de Superficie / Terreno
                      </label>
                      <select
                        value={formData.groundType}
                        onChange={(e) => setField('groundType', e.target.value)}
                        className="input w-full text-sm"
                      >
                        {GROUND_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Hora de Inicio
                      </label>
                      <select
                        value={formData.startTime}
                        onChange={(e) => setField('startTime', e.target.value)}
                        className="input w-full text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Hora de Finalización
                      </label>
                      <select
                        value={formData.endTime}
                        onChange={(e) => setField('endTime', e.target.value)}
                        className="input w-full text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <EquipmentPicker
                        value={formData.equipment}
                        onChange={handleEquipmentChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Price & Deposit */}
                <div className="p-4 bg-surface-elevated rounded-xl border border-border space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                    💰 Precio y Anticipo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-text-primary">
                        Precio Total Acordado ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setField('price', e.target.value)}
                        placeholder="350.00"
                        className="input w-full text-sm font-semibold"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.hasDeposit}
                          onChange={(e) => {
                            setField('hasDeposit', e.target.checked);
                            if (!e.target.checked) setField('deposit', '');
                          }}
                          className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                        />
                        <span className="font-semibold text-text-primary text-xs sm:text-sm">
                          ¿El cliente dio anticipo / depósito?
                        </span>
                      </label>
                    </div>

                    {formData.hasDeposit ? (
                      <div className="sm:col-span-2 pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-text-primary">
                            Monto del Anticipo ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.deposit}
                            onChange={(e) => setField('deposit', e.target.value)}
                            placeholder="Ej. 50.00"
                            className="input w-full text-sm"
                          />
                        </div>
                        <div className="p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl">
                          <span className="block text-xs text-text-muted font-medium">
                            Saldo Restante a Cobrar al Entregar:
                          </span>
                          <span className="text-lg font-extrabold text-primary">
                            ${balanceDue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* 5. Special Notes */}
                <div className="p-4 bg-surface-elevated rounded-xl border border-border space-y-2">
                  <label className="block text-xs font-semibold text-text-primary">
                    📝 Notas Especiales / Instrucciones de Entrega
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Instrucciones de portón, acceso, contacto secundario, etc."
                    className="input w-full text-sm resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Sticky Modal Footer */}
            <div className="px-5 py-3.5 border-t border-border bg-surface-elevated/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-text-muted hidden sm:inline">
                * Campos obligatorios para generar el contrato
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn btn-ghost px-4 py-2 text-xs sm:text-sm text-text-muted hover:text-text-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="create-contract-form"
                  disabled={loading}
                  className="btn btn-primary px-5 py-2 text-xs sm:text-sm flex items-center gap-2 shadow-sm font-bold"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span> Enviando...
                    </>
                  ) : (
                    <>
                      <span>📩</span> Crear y Enviar Contrato
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
