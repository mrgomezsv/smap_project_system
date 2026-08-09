import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL || 'mrgomez.dev@gmail.com';
  const password = process.env.ADMIN_SEED_PASSWORD || 'Karin2100';

  console.log(
    `🚀 Iniciando creación/sincronización de superusuario admin: ${email}`,
  );

  // 1. Inicializar Firebase Admin
  const credentialsPath =
    process.env.FIREBASE_CREDENTIALS_PATH ||
    'credentials/smap-kf-firebase-adminsdk-xqq0l-4790d70941.json';
  const absolutePath = path.isAbsolute(credentialsPath)
    ? credentialsPath
    : path.join(process.cwd(), credentialsPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(
      `❌ Archivo de credenciales Firebase no encontrado en ${absolutePath}`,
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'smap-kf',
    });
  }

  const auth = getAuth();
  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(
      `✅ Usuario encontrado en Firebase Auth (UID: ${userRecord.uid})`,
    );
    // Actualizar contraseña si fue especificada
    await auth.updateUser(userRecord.uid, { password });
    console.log(`🔑 Contraseña actualizada exitosamente en Firebase Auth.`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`⚠️ Usuario no existe en Firebase Auth. Creándolo...`);
      userRecord = await auth.createUser({
        email,
        password,
        displayName: 'Mario Gomez (Admin)',
        emailVerified: true,
      });
      console.log(
        `✅ Usuario creado en Firebase Auth (UID: ${userRecord.uid})`,
      );
    } else {
      console.error(`❌ Error interactuando con Firebase Auth:`, error);
      process.exit(1);
    }
  }

  // 2. Sincronizar en DB MariaDB (auth_user)
  const prisma = new PrismaClient();
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email,
          isStaff: true,
          isSuperuser: true,
          isActive: true,
        },
      });
      console.log(
        `✅ Usuario sincronizado como Superuser/Staff en MariaDB (ID: ${existingUser.id})`,
      );
    } else {
      const newUser = await prisma.user.create({
        data: {
          username: email,
          email,
          firstName: 'Mario',
          lastName: 'Gomez',
          isStaff: true,
          isSuperuser: true,
          isActive: true,
        },
      });
      console.log(
        `✅ Creado registro de usuario en MariaDB (ID: ${newUser.id})`,
      );
    }
  } catch (error) {
    console.error(`❌ Error sincronizando usuario en MariaDB:`, error);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`🎉 Proceso completado exitosamente para ${email}.`);
}

seedAdmin();
