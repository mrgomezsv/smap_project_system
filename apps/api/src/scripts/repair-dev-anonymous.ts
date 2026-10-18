/**
 * Repara los waivers que quedaron asignados al usuario sintético
 * "dev-anonymous" mientras Firebase Admin no estaba inicializado en
 * producción (todas las peticiones se atendían como ese usuario).
 *
 * Para cada waiver con user_id = 'dev-anonymous' busca en Firebase Auth el
 * usuario por el email del titular (user_email) y le reasigna su UID real.
 *
 * Uso (dentro del contenedor de la API o con DATABASE_URL apuntando a la BD):
 *   npx ts-node src/scripts/repair-dev-anonymous.ts          # simulación
 *   npx ts-node src/scripts/repair-dev-anonymous.ts --apply  # aplica cambios
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const DEV_UID = 'dev-anonymous';

function initFirebase() {
  const base64 = process.env.FIREBASE_CREDENTIALS_BASE64;
  const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
  let serviceAccount: Record<string, unknown>;
  if (base64) {
    serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } else if (credentialsPath) {
    const abs = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.join(process.cwd(), credentialsPath);
    serviceAccount = JSON.parse(fs.readFileSync(abs, 'utf-8'));
  } else {
    console.error(
      '❌ Define FIREBASE_CREDENTIALS_BASE64 o FIREBASE_CREDENTIALS_PATH',
    );
    process.exit(1);
  }
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount as never),
      projectId: process.env.FIREBASE_PROJECT_ID || 'smap-kf',
    });
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  initFirebase();
  const auth = getAuth();
  const prisma = new PrismaClient();

  try {
    const waivers = await prisma.waiverQRV2.findMany({
      where: { userId: DEV_UID },
      select: { id: true, qrCode: true, userEmail: true },
    });
    console.log(`🔎 ${waivers.length} waivers asignados a "${DEV_UID}"`);

    const uidByEmail = new Map<string, string | null>();
    let fixed = 0;
    const unresolved: string[] = [];

    for (const w of waivers) {
      const email = w.userEmail.trim().toLowerCase();
      if (!uidByEmail.has(email)) {
        try {
          uidByEmail.set(email, (await auth.getUserByEmail(email)).uid);
        } catch {
          uidByEmail.set(email, null);
        }
      }
      const uid = uidByEmail.get(email);
      if (!uid) {
        unresolved.push(`${w.qrCode} (${email})`);
        continue;
      }
      if (apply) {
        await prisma.waiverQRV2.update({
          where: { id: w.id },
          data: { userId: uid },
        });
      }
      fixed++;
    }

    const comments = await prisma.productComment.count({
      where: { userId: DEV_UID },
    });

    console.log(
      `${apply ? '✅ Reasignados' : '📝 Se reasignarían'}: ${fixed} waivers`,
    );
    if (unresolved.length) {
      console.log(
        `⚠️ Sin usuario en Firebase con ese email (${unresolved.length}):\n  ${unresolved.join('\n  ')}`,
      );
    }
    if (comments) {
      console.log(
        `ℹ️ ${comments} comentarios quedaron como "${DEV_UID}" (sin email para reasignar; revisar en el admin).`,
      );
    }
    if (!apply) console.log('Ejecuta con --apply para guardar los cambios.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
