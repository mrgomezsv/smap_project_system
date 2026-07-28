'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
}

interface Message {
  id: string;
  from: 'user' | 'admin';
  text: string;
  timestamp: string;
}

export function ChatsView() {
  const tPh = useTranslations('placeholders');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');

  const selected = conversations.find((c) => c.id === selectedId);

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
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm space-y-2">
            <div className="text-4xl opacity-40">💬</div>
            <p className="font-semibold text-text-primary">No hay chats activos</p>
            <p className="text-xs">Los mensajes directos de usuarios en tiempo real aparecerán aquí.</p>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={[
                    'w-full text-left p-3 border-b border-border transition',
                    selectedId === c.id ? 'bg-primary/5' : 'hover:bg-surface',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brand-yellow text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {c.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-text-primary text-sm truncate">{c.name}</p>
                        <span className="text-xs text-text-muted shrink-0">{c.timestamp}</span>
                      </div>
                      <p className="text-xs text-text-muted truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Ventana de Hilo / Chat */}
      <div className="md:col-span-2 flex flex-col">
        {selected ? (
          <>
            <header className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brand-yellow text-white flex items-center justify-center font-bold text-sm">
                {selected.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{selected.name}</p>
                <p className="text-xs text-text-muted">En línea</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={['flex', m.from === 'admin' ? 'justify-end' : 'justify-start'].join(' ')}
                >
                  <div
                    className={[
                      'max-w-[70%] px-4 py-2 rounded-2xl text-sm',
                      m.from === 'admin'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-surface text-text-primary rounded-bl-sm',
                    ].join(' ')}
                  >
                    <p>{m.text}</p>
                    <p
                      className={[
                        'text-[10px] mt-1',
                        m.from === 'admin' ? 'text-white/70' : 'text-text-muted',
                      ].join(' ')}
                    >
                      {m.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (reply.trim()) setReply('');
              }}
              className="p-3 border-t border-border flex gap-2"
            >
              <input
                type="text"
                className="input flex-1"
                placeholder={tPh('typeMessage')}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!reply.trim()}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-2">
            <div className="text-5xl opacity-30">💬</div>
            <p className="font-bold text-text-primary text-base">Selecciona una conversación</p>
            <p className="text-xs max-w-sm">
              Elige una conversación de la lista de la izquierda para comenzar a responderle en tiempo real al usuario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
