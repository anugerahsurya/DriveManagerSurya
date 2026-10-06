import "server-only";

function read(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variabel lingkungan ${name} belum diisi. Lihat .env.example.`);
  return value;
}

export const env = {
  sessionSecret: () => read("SESSION_SECRET"),
  tokenKey: () => read("TOKEN_ENCRYPTION_KEY"),
  githubId: () => read("GITHUB_CLIENT_ID"),
  githubSecret: () => read("GITHUB_CLIENT_SECRET"),
  googleId: () => read("GOOGLE_CLIENT_ID"),
  googleSecret: () => read("GOOGLE_CLIENT_SECRET"),
  allowedLogin: () => read("ALLOWED_GITHUB_LOGIN").toLowerCase(),
  allowedId: () => process.env.ALLOWED_GITHUB_ID ?? null,
  driveScope: () => process.env.GOOGLE_DRIVE_SCOPE ?? "https://www.googleapis.com/auth/drive.file",
  cronSecret: () => process.env.CRON_SECRET ?? null,
};

/** Origin publik aplikasi. APP_URL menang bila diisi, selain itu diambil dari request. */
export function appOrigin(req: Request): string {
  return process.env.APP_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
}
