'use client';

import { useState, useCallback } from 'react';

/**
 * Página temporal para sembrar la colección "admins" en Firestore.
 * Una vez ejecutada exitosamente, esta página debe eliminarse del proyecto.
 */

const ADMIN_USERS = [
  {
    email: 'mrgomez.dev@outlook.com',
    username: 'mrgomez',
    role: 'superadmin',
    is_active: true,
  },
  {
    email: 'karenhenriquez911@gmail.com',
    username: 'karen911',
    role: 'admin',
    is_active: true,
  },
  {
    email: 'miguel_mauricio@live.com',
    username: 'mgomez',
    role: 'admin',
    is_active: true,
  },
];

export default function SeedAdminsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  async function handleSeed() {
    setRunning(true);
    setLogs([]);
    addLog('🔄 Iniciando proceso de siembra...');

    try {
      // Importar dinámicamente para evitar errores de SSR
      addLog('📦 Cargando SDK de Firebase...');
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, doc, setDoc, getDoc } = await import('firebase/firestore');

      addLog('✅ SDK cargado correctamente');

      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      if (!config.apiKey || !config.projectId) {
        addLog('❌ Firebase no está configurado. Faltan NEXT_PUBLIC_FIREBASE_API_KEY o PROJECT_ID.');
        setRunning(false);
        return;
      }

      addLog(`📋 Proyecto Firebase: ${config.projectId}`);

      const app = getApps().length ? getApps()[0] : initializeApp(config);
      const db = getFirestore(app);
      addLog('✅ Conexión a Firestore establecida');

      let created = 0;
      let skipped = 0;

      for (const admin of ADMIN_USERS) {
        addLog(`📝 Procesando: ${admin.email}...`);

        try {
          const docRef = doc(db, 'admins', admin.email);

          // Verificar si ya existe
          const existing = await getDoc(docRef);
          if (existing.exists()) {
            addLog(`⚠️  Ya existe documento para ${admin.email} — omitido`);
            skipped++;
            continue;
          }

          await setDoc(docRef, {
            email: admin.email,
            username: admin.username,
            role: admin.role,
            is_active: admin.is_active,
            created_at: new Date().toISOString(),
          });

          addLog(`✅ Creado documento admin para: ${admin.email} (rol: ${admin.role})`);
          created++;
        } catch (docErr) {
          addLog(`❌ Error al procesar ${admin.email}: ${(docErr as Error).message}`);
        }
      }

      addLog('');
      addLog(`🎉 Siembra completada — ${created} creados, ${skipped} omitidos`);
      addLog('');
      addLog('⚠️  IMPORTANTE: Ahora restaura las reglas de seguridad en Firebase Console.');
      setDone(true);
    } catch (err) {
      addLog(`❌ Error general: ${(err as Error).message}`);
      console.error('Seed error:', err);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">
          🌱 Sembrar Administradores
        </h1>
        <p className="text-text-muted mt-1">
          Crea la colección{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">admins</code> en Cloud
          Firestore con los usuarios administrativos del sistema.
        </p>
      </header>

      <div className="card mb-6">
        <h2 className="font-semibold text-lg mb-3">Usuarios a crear:</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-text-muted">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Username</th>
                <th className="py-2">Rol</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_USERS.map((u) => (
                <tr key={u.email} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{u.email}</td>
                  <td className="py-2 pr-4">{u.username}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'superadmin'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!done && (
        <button
          onClick={handleSeed}
          disabled={running}
          className="w-full py-3 px-6 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all text-center"
        >
          {running ? '⏳ Sembrando...' : '🚀 Sembrar colección admins en Firestore'}
        </button>
      )}

      {logs.length > 0 && (
        <div className="mt-6 bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}

      {done && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
          <p className="font-semibold">✅ Colección creada exitosamente</p>
          <p className="text-sm mt-1">
            Ahora restaura las reglas seguras en Firebase Console y elimina esta página del proyecto.
          </p>
        </div>
      )}
    </div>
  );
}
