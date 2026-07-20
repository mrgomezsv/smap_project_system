'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import { PARTNER_LABELS, type Event, type EventPartner } from '@/lib/types';

interface EventFormProps {
  initial?: Event;
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  description: string;
  location: string;
  startDatetime: string;
  ticketPrice: string;
  partners: EventPartner;
  published: boolean;
  image: string;
}

const EMPTY: FormData = {
  title: '',
  description: '',
  location: '',
  startDatetime: '',
  ticketPrice: '0',
  partners: 'partner1',
  published: false,
  image: '',
};

export function EventForm({ initial, mode }: EventFormProps) {
  const router = useRouter();
  const tPh = useTranslations('placeholders');
  const [data, setData] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setData({
        title: initial.title,
        description: initial.description,
        location: initial.location,
        startDatetime: initial.startDatetime ? initial.startDatetime.slice(0, 16) : '',
        ticketPrice: initial.ticketPrice.toString(),
        partners: (initial.partners as EventPartner) || 'partner1',
        published: initial.published,
        image: initial.image ?? '',
      });
    }
  }, [initial]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      title: data.title,
      description: data.description,
      location: data.location,
      startDatetime: new Date(data.startDatetime).toISOString(),
      ticketPrice: Number(data.ticketPrice),
      partners: data.partners,
      published: data.published,
      image: data.image || undefined,
    };

    try {
      if (mode === 'create') {
        await api.post('/api/events', payload);
      } else if (initial) {
        await api.patch(`/api/events/${initial.id}`, payload);
      }
      router.push('/admin/eventos');
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : 'Error al guardar el evento');
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
        <h2 className="text-lg font-heading font-bold text-text-primary">Información del evento</h2>
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
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Descripción <span className="text-danger">*</span>
          </label>
          <textarea
            rows={5}
            className="input resize-none"
            value={data.description}
            onChange={(e) => update('description', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Ubicación <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={data.location}
              onChange={(e) => update('location', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Fecha y hora <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              className="input"
              value={data.startDatetime}
              onChange={(e) => update('startDatetime', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Precio entrada ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={data.ticketPrice}
              onChange={(e) => update('ticketPrice', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Organizador</label>
            <select
              className="input"
              value={data.partners}
              onChange={(e) => update('partners', e.target.value as EventPartner)}
            >
              {Object.entries(PARTNER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Imagen (filename)</label>
          <input
            type="text"
            className="input"
            placeholder={tPh('eventImageFilename')}
            value={data.image}
            onChange={(e) => update('image', e.target.value)}
          />
          <p className="text-xs text-text-muted mt-1">
            Sube el archivo a <code>/media/event_images/</code> y coloca aquí el nombre.
          </p>
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
              checked={data.published}
              onChange={(e) => update('published', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-checked:bg-success rounded-full transition relative">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
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
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear evento' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
