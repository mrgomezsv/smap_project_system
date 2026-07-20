'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          background: '#fafafa',
          color: '#0f172a',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>😵</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Error crítico
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            La aplicación tuvo un problema grave. Por favor recarga la página.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
              }}
            >
              ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
