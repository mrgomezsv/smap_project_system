'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, ApiError } from '@/lib/api';

interface ApiUser {
  id: number;
  username: string;
  email: string;
}

interface ApiMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface ApiRoom {
  id: number;
  userId: number;
  lastMessageAt: string;
  user: ApiUser;
  messages: ApiMessage[];
  _count?: { messages: number };
}

const POLL_MS = 10_000;

function displayName(user?: ApiUser | null): string {
  if (!user) return 'Usuario';
  return user.username?.split('@')[0] || user.email || 'Usuario';
}

function initials(name: string): string {
  return name
    .split(/[\s._-]+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function ChatsView() {
  const searchParams = useSearchParams();
  const targetEmail = searchParams.get('email');
  const { getToken, ready, user } = useAuth();
  const tPh = useTranslations('placeholders');

  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadRooms = useCallback(async () => {
    try {
      const data = await api.get<ApiRoom[]>('/api/chat/rooms', { getToken });
      setRooms(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los chats');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const loadRoom = useCallback(
    async (id: number) => {
      try {
        const data = await api.get<ApiRoom>(`/api/chat/rooms/${id}`, { getToken });
        setRoom(data);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar la conversación');
      }
    },
    [getToken],
  );

  // Carga inicial + polling de la lista
  useEffect(() => {
    if (!ready || !user) return;
    loadRooms();
    const id = setInterval(loadRooms, POLL_MS);
    return () => clearInterval(id);
  }, [ready, user, loadRooms]);

  // Abrir conversación directa desde /admin/usuarios (?email=)
  useEffect(() => {
    if (!ready || !user || !targetEmail) return;
    api
      .post<ApiRoom>('/api/chat/rooms/for-email', { email: targetEmail }, { getToken })
      .then((r) => {
        setSelectedId(r.id);
        loadRooms();
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'No se pudo abrir la conversación'),
      );
  }, [ready, user, targetEmail, getToken, loadRooms]);

  // Carga + polling de la conversación seleccionada
  useEffect(() => {
    if (selectedId == null) {
      setRoom(null);
      return;
    }
    loadRoom(selectedId);
    const id = setInterval(() => loadRoom(selectedId), POLL_MS);
    return () => clearInterval(id);
  }, [selectedId, loadRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = reply.trim();
    if (!content || selectedId == null) return;
    setSending(true);
    try {
      await api.post('/api/chat/messages', { chatRoomId: selectedId, content }, { getToken });
      setReply('');
      await Promise.all([loadRoom(selectedId), loadRooms()]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  const term = search.trim().toLowerCase();
  const filtered = term
    ? rooms.filter(
        (r) =>
          r.user?.email?.toLowerCase().includes(term) ||
          r.user?.username?.toLowerCase().includes(term),
      )
    : rooms;
  const selectedName = displayName(room?.user ?? rooms.find((r) => r.id === selectedId)?.user);

  return (
    <div className="card p-0 overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)]">
      {/* Lista de Conversaciones */}
      <aside className="border-r border-border overflow-y-auto">
        <div className="p-3 border-b border-border">
          <input
            type="search"
            placeholder={tPh('searchConversations')}
            className="input !py-2 text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {error && (
          <div className="m-3 bg-danger/10 border border-danger/30 text-danger text-xs rounded-lg p-2">
            ⚠ {error}
          </div>
        )}
        {loading ? (
          <p className="p-8 text-center text-text-muted text-sm">Cargando conversaciones…</p>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm space-y-2">
            <div className="text-4xl opacity-40">💬</div>
            <p className="font-semibold text-text-primary">No hay chats activos</p>
            <p className="text-xs">Los mensajes de los usuarios aparecerán aquí.</p>
          </div>
        ) : (
          <ul>
            {filtered.map((r) => {
              const name = displayName(r.user);
              const last = r.messages[0];
              const unread = r._count?.messages ?? 0;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={[
                      'w-full text-left p-3 border-b border-border transition',
                      selectedId === r.id ? 'bg-primary/5' : 'hover:bg-surface',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brand-yellow text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-text-primary text-sm truncate">{name}</p>
                          <span className="text-xs text-text-muted shrink-0">
                            {formatTime(r.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {last?.content ?? 'Sin mensajes'}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Ventana de Hilo / Chat */}
      <div className="md:col-span-2 flex flex-col">
        {selectedId != null ? (
          <>
            <header className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brand-yellow text-white flex items-center justify-center font-bold text-sm">
                {initials(selectedName)}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{selectedName}</p>
                <p className="text-xs text-text-muted">{room?.user?.email}</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!room ? (
                <p className="text-center text-text-muted text-sm">Cargando…</p>
              ) : room.messages.length === 0 ? (
                <p className="text-center text-text-muted text-sm">
                  Aún no hay mensajes. Escribe el primero.
                </p>
              ) : (
                room.messages.map((m) => {
                  const fromAdmin = m.senderId !== room.userId;
                  return (
                    <div
                      key={m.id}
                      className={['flex', fromAdmin ? 'justify-end' : 'justify-start'].join(' ')}
                    >
                      <div
                        className={[
                          'max-w-[70%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words',
                          fromAdmin
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-surface text-text-primary rounded-bl-sm',
                        ].join(' ')}
                      >
                        <p>{m.content}</p>
                        <p
                          className={[
                            'text-[10px] mt-1',
                            fromAdmin ? 'text-white/70' : 'text-text-muted',
                          ].join(' ')}
                        >
                          {formatTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder={tPh('typeMessage')}
                value={reply}
                maxLength={5000}
                onChange={(e) => setReply(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!reply.trim() || sending}>
                {sending ? 'Enviando…' : 'Enviar'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-2">
            <div className="text-5xl opacity-30">💬</div>
            <p className="font-bold text-text-primary text-base">Selecciona una conversación</p>
            <p className="text-xs max-w-sm">
              Elige una conversación de la lista de la izquierda para responderle al usuario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
