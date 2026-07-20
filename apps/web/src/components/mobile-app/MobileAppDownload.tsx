'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kidsfun.app.kidsfun';

export function MobileAppDownload() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(PLAY_STORE_URL, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 280,
    }).then(setQrDataUrl);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="p-4 bg-white border-2 border-border rounded-2xl shadow-large">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR para descargar Kidsfun App"
            className="w-56 h-56"
          />
        ) : (
          <div className="w-56 h-56 bg-gray-100 flex items-center justify-center text-text-muted text-sm">
            Generando QR…
          </div>
        )}
      </div>
      <p className="text-sm text-text-muted text-center max-w-xs">
        📱 Abre la cámara de tu teléfono y apunta al código QR para ir a Google Play.
      </p>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
        aria-label="Descargar en Google Play"
      >
        <img
          alt="Get it on Google Play"
          src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
          width={200}
          height={75}
          className="h-14 w-auto"
        />
      </a>
    </div>
  );
}
