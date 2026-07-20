'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

type Segment = 'all' | 'event-attendees' | 'product-buyer';

export function PushForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSent(null);
    try {
      const auth = getFirebaseAuth();
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!token) {
        setError('Necesitas iniciar sesión para enviar notificaciones.');
        return;
      }
      const res = await api.post<{ count: number }>(
        '/api/push/send',
        { title, body, segment },
        { token },
      );
      setSent(res);
      setTitle('');
      setBody('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="text-lg font-heading font-bold text-text-primary">Componer notificación</h2>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
            ⚠ {error}
          </div>
        )}
        {sent && (
          <div className="bg-success/10 border border-success/30 text-success text-sm rounded-lg p-3">
            ✓ Notificación enviada a {sent.count} usuario(s).
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Segmento
          </label>
          <select
            className="input"
            value={segment}
            onChange={(e) => setSegment(e.target.value as Segment)}
          >
            <option value="all">Todos los usuarios</option>
            <option value="event-attendees">Asistentes a eventos</option>
            <option value="product-buyer">Compradores de productos</option>
          </select>
          <p className="text-xs text-text-muted mt-1">
            Define a quién le llegará la notificación.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Título <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="🎉 ¡Nueva promo!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={60}
          />
          <p className="text-xs text-text-muted mt-1">{title.length}/60</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Mensaje <span className="text-danger">*</span>
          </label>
          <textarea
            rows={5}
            className="input resize-none"
            placeholder="Escribe el cuerpo de la notificación…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={240}
          />
          <p className="text-xs text-text-muted mt-1">{body.length}/240</p>
        </div>
        <button type="submit" disabled={sending} className="btn btn-primary w-full py-3">
          {sending ? 'Enviando…' : '🔔 Enviar notificación'}
        </button>
      </form>

      {/* Preview */}
      <div>
        <h2 className="text-lg font-heading font-bold text-text-primary mb-3">Vista previa</h2>
        <div className="card bg-gradient-to-br from-gray-900 to-gray-800 !p-4">
          <p className="text-xs text-white/60 mb-3">Notificación push</p>
          <div className="bg-white/95 rounded-2xl p-4 shadow-large">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-yellow to-party-pink flex items-center justify-center text-white text-lg shrink-0">
                🎈
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text-primary text-sm">Kidsfun</p>
                  <span className="text-xs text-text-muted">ahora</span>
                </div>
                <p className="font-semibold text-text-primary text-sm mt-1">
                  {title || '🎉 ¡Nueva promo!'}
                </p>
                <p className="text-text-muted text-sm mt-0.5">
                  {body || 'Escribe el cuerpo de la notificación…'}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3 text-center">
            Así se verá en el dispositivo del usuario
          </p>
        </div>
      </div>
    </div>
  );
}
