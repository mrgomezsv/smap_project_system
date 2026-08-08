'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateContractModal({ isOpen, onClose, onSuccess }: CreateContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientCityStateZip: '',
    driverLicense: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    equipment: '',
    groundType: 'Grass',
    price: '',
    deposit: '',
    notes: '',
  });

  if (!isOpen) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        ...formData,
        price: formData.price ? Number(formData.price) : undefined,
        deposit: formData.deposit ? Number(formData.deposit) : undefined,
      };

      const res = await api.post<{ contract: any; signUrl: string; emailSent: boolean }>(
        '/api/v2/contracts',
        payload
      );

      setCreatedUrl(res.signUrl);
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
        >
          ✕
        </button>

        <h2 className="text-2xl font-heading font-extrabold text-text-primary mb-1">
          📝 Crear y Enviar Contrato de Renta
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Ingresa la información acordada en la llamada para enviar el contrato por correo al cliente.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {createdUrl ? (
          <div className="space-y-4 text-center py-6">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-bold text-success">¡Contrato Creado y Enviado por Email!</h3>
            <p className="text-sm text-text-muted">
              Le enviamos un correo electrónico al cliente con el botón para firmar. También puedes copiar el enlace directo a continuación:
            </p>
            <div className="p-3 bg-surface-elevated border border-border rounded-xl font-mono text-xs break-all select-all">
              {createdUrl}
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdUrl);
                  alert('¡Enlace copiado al portapapeles!');
                }}
                className="btn btn-secondary text-sm"
              >
                📋 Copiar Enlace
              </button>
              <button onClick={onClose} className="btn btn-primary text-sm">
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="Ej. John Doe"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  name="clientEmail"
                  required
                  value={formData.clientEmail}
                  onChange={handleChange}
                  placeholder="cliente@email.com"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono Fijo / Celular</label>
                <input
                  type="text"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  placeholder="(555) 000-0000"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Licencia de Conducir (#)</label>
                <input
                  type="text"
                  name="driverLicense"
                  value={formData.driverLicense}
                  onChange={handleChange}
                  placeholder="DL-1234567"
                  className="input w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Dirección de Entrega *</label>
                <input
                  type="text"
                  name="clientAddress"
                  required
                  value={formData.clientAddress}
                  onChange={handleChange}
                  placeholder="Street Address"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ciudad, Estado y Zip</label>
                <input
                  type="text"
                  name="clientCityStateZip"
                  value={formData.clientCityStateZip}
                  onChange={handleChange}
                  placeholder="New York, NY 10001"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fecha del Evento</label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hora de Inicio</label>
                <input
                  type="text"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  placeholder="10:00 AM"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hora de Finalización</label>
                <input
                  type="text"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  placeholder="06:00 PM"
                  className="input w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Equipo / Inflable Contratado *</label>
                <input
                  type="text"
                  name="equipment"
                  required
                  value={formData.equipment}
                  onChange={handleChange}
                  placeholder="Ej. Barbie Bounce House & Cotton Candy Machine"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tipo de Superficie</label>
                <select
                  name="groundType"
                  value={formData.groundType}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="Grass">Grama / Cesped (Grass)</option>
                  <option value="Concrete">Concreto / Asfalto (Concrete)</option>
                  <option value="Dirt">Tierra (Dirt)</option>
                  <option value="Other">Otro (Other)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Precio Acordado ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="350.00"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Depósito ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  placeholder="50.00"
                  className="input w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Notas Especiales / Instrucciones</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
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
                {loading ? 'Creando...' : '📩 Crear y Enviar Contrato'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
