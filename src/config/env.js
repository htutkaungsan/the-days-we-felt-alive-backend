import 'dotenv/config';
export const env = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES_IN || '2h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
};
export function validateEnv() {
  if (!env.jwtSecret || env.jwtSecret.length < 32) throw new Error('JWT_SECRET must have at least 32 characters');
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must have at least 8 characters');
}
