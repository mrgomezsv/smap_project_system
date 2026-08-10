const DEFAULT_ADMIN_EMAILS = [
  'mrgomez.dev@outlook.com',
  'kidsfun.developer@gmail.com',
  'karenhenriquez911@gmail.com',
];

export function getAdminEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (!envEmails) return DEFAULT_ADMIN_EMAILS;
  const parsed = envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.trim().toLowerCase());
}
