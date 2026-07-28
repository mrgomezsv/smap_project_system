'use client';

import { useState } from 'react';

interface WaiverWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  waiver: {
    qrCode: string;
    userName: string;
    userPhone?: string | null;
  } | null;
}

export function WaiverWhatsAppModal({ isOpen, onClose, waiver }: WaiverWhatsAppModalProps) {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [phone, setPhone] = useState(waiver?.userPhone || '');

  if (!isOpen || !waiver) return null;

  const currentPhone = phone || waiver.userPhone || '';
  const cleanPhone = currentPhone.replace(/\D/g, '');

  const textEs = `Hola *${waiver.userName}*, te enviamos la información de tu Waiver de *Kidsfun*:

🎫 *Código QR:* ${waiver.qrCode}
📄 *Descarga tu PDF:* ${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/success?qr=${waiver.qrCode}

¡Gracias por tu registro y te esperamos en el evento! 🎪`;

  const textEn = `Hello *${waiver.userName}*, here is your *Kidsfun* Waiver information:

🎫 *QR Code:* ${waiver.qrCode}
📄 *Download PDF:* ${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/success?qr=${waiver.qrCode}

Thank you for registering! 🎪`;

  const messageText = lang === 'es' ? textEs : textEn;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-heading font-extrabold text-text-primary flex items-center gap-2">
            <span>💬</span> Reenviar por WhatsApp
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Teléfono del Destinatario (con código de país)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +13478704240"
              className="input w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Idioma de la Plantilla
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                  lang === 'es'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-muted border-border hover:bg-gray-100'
                }`}
              >
                🇪🇸 Español
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                  lang === 'en'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-muted border-border hover:bg-gray-100'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Previsualización del Mensaje
            </label>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-mono text-emerald-900 whitespace-pre-wrap">
              {messageText}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button onClick={onClose} className="btn bg-gray-100 text-text-muted px-4 py-2 text-xs">
            Cancelar
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="btn bg-success text-white hover:bg-success/90 px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <span>💬</span> Abrir WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
