'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
}

const SAMPLE_CONVS: Conversation[] = [
  { id: 1, name: 'María Pérez', lastMessage: '¿Tienen disponibilidad para el 15?', timestamp: '10:32', unread: 2 },
  { id: 2, name: 'Carlos López', lastMessage: 'Perfecto, confirmado entonces', timestamp: '09:15', unread: 0 },
  { id: 3, name: 'Ana Rodríguez', lastMessage: 'Gracias por la info 🙏', timestamp: 'Ayer', unread: 0 },
  { id: 4, name: 'Luis Martínez', lastMessage: 'Cuánto cuesta el paquete completo?', timestamp: 'Ayer', unread: 1 },
  { id: 5, name: 'Sofía García', lastMessage: '👍', timestamp: 'Mar', unread: 0 },
];

interface Message {
  id: number;
  from: 'user' | 'admin';
  text: string;
  timestamp: string;
}

const SAMPLE_MESSAGES: Message[] = [
  { id: 1, from: 'user', text: 'Hola! Quiero cotizar una fiesta para 20 niños', timestamp: '10:30' },
  { id: 2, from: 'admin', text: '¡Hola María! Con gusto te ayudo. ¿Para qué fecha?', timestamp: '10:31' },
  { id: 3, from: 'user', text: 'Para el sábado 15', timestamp: '10:32' },
  { id: 4, from: 'user', text: '¿Tienen disponibilidad para el 15?', timestamp: '10:32' },
];

export function ChatsView() {
  const tPh = useTranslations('placeholders');
  const [selectedId, setSelectedId] = useState<number>(SAMPLE_CONVS[0].id);
  const [reply, setReply] = useState('');
  const selected = SAMPLE_CONVS.find((c) => c.id === selectedId)!;

  return (
    <div className="card p-0 overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)]">
      {/* Lista */}
      <aside className="border-r border-border overflow-y-auto">
        <div className="p-3 border-b border-border">
          <input
            type="search"
            placeholder={tPh('searchConversations')}
            className="input !py-2 text-sm"
          />
        </div>
        <ul>
          {SAMPLE_CONVS.map((c) => (
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
      </aside>

      {/* Thread */}
      <div className="md:col-span-2 flex flex-col">
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
          {SAMPLE_MESSAGES.map((m) => (
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
      </div>
    </div>
  );
}
