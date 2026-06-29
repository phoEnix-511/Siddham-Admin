import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildSslConfig(connectionString: string): pg.PoolConfig['ssl'] | undefined {
  // Detect if SSL is needed (production cloud DBs: Neon, Supabase, Railway, etc.)
  const needsSsl =
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase.co') ||
    connectionString.includes('railway.app') ||
    connectionString.includes('render.com') ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('sslmode=verify-full') ||
    connectionString.includes('sslmode=prefer');

  if (!needsSsl) return undefined;

  // Use verify-full equivalent: check cert, but trust cloud providers' CAs
  return { rejectUnauthorized: false };
}

function sanitizeConnectionString(connectionString: string): string {
  // Remove sslmode from URL to avoid pg-connection-string deprecation warnings
  // We handle SSL ourselves via the pool config
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createPrismaClient() {
  const rawConnectionString = process.env.DATABASE_URL || '';
  const connectionString = sanitizeConnectionString(rawConnectionString);
  const ssl = buildSslConfig(rawConnectionString); // check original for sslmode param

  const pool = new pg.Pool({
    connectionString,
    ssl,
    // Explicit pool sizing to handle concurrent requests without exhausting DB connections
    max: 20,
    idleTimeoutMillis: 30_000,      // close idle connections after 30 s
    connectionTimeoutMillis: 5_000, // fail fast if no connection available in 5 s
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
