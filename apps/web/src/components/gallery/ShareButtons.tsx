'use client';

import { useEffect, useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  labels: { share: string; shareTitle: string; copyLink: string; copied: string };
}

/** Botones para compartir el álbum en redes y copiar el enlace. */
export function ShareButtons({ url, title, labels }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const text = encodeURIComponent(`${title} 🎉`);
  const encodedUrl = encodeURIComponent(url);
  const links = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${text}%20${encodedUrl}`,
      className: 'bg-[#25D366] hover:bg-[#1ebe5a]',
      icon: '💬',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-[#1877F2] hover:bg-[#0f66d8]',
      icon: 'f',
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      className: 'bg-black hover:bg-gray-800',
      icon: '𝕏',
    },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(labels.copyLink, url);
    }
  }

  return (
    <div className="card">
      <p className="font-heading font-bold text-text-primary mb-3">{labels.shareTitle}</p>
      <div className="flex flex-wrap gap-2">
        {canNativeShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title, url }).catch(() => {})}
            className="btn btn-primary !py-2 !px-4 text-sm"
          >
            📤 {labels.share}
          </button>
        )}
        {links.map((l) => (
          <a
            key={l.name}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-white text-sm font-semibold py-2 px-4 rounded-full transition ${l.className}`}
          >
            <span className="font-bold">{l.icon}</span> {l.name}
          </a>
        ))}
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-full border border-border hover:bg-surface transition"
        >
          🔗 {copied ? labels.copied : labels.copyLink}
        </button>
      </div>
    </div>
  );
}
