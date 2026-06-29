/**
 * prod-fix.ts
 * ------------------------------------------------------------------
 * Runs directly against the PRODUCTION DATABASE_URL.
 * 1. Applies the missing AdminUser columns via raw SQL (IF NOT EXISTS).
 * 2. Resets the super-admin password to Admin@123
 * ------------------------------------------------------------------
 * Usage:
 *   $env:DATABASE_URL="your-prod-db-url"
 *   npx tsx scripts/prod-fix.ts
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Strip sslmode from URL and handle SSL natively to avoid pg warnings
function buildPoolConfig(rawUrl: string): pg.PoolConfig {
  const needsSsl =
    rawUrl.includes('neon.tech') ||
    rawUrl.includes('supabase.co') ||
    rawUrl.includes('railway.app') ||
    rawUrl.includes('sslmode=require') ||
    rawUrl.includes('sslmode=prefer') ||
    rawUrl.includes('sslmode=verify');

  let connectionString = rawUrl;
  try {
    const u = new URL(rawUrl);
    u.searchParams.delete('sslmode');
    connectionString = u.toString();
  } catch {}

  return {
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10_000,
  };
}

async function main() {
  const pool = new pg.Pool(buildPoolConfig(DATABASE_URL!));

  try {
    console.log('🔗  Connecting to database...');
    const client = await pool.connect();

    // ── Step 1: Apply missing schema changes ─────────────────────────────
    console.log('\n📦  Applying missing schema migrations...');

    await client.query(`
      ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3);
    `);
    console.log('  ✓ AdminUser.lastLogin');

    await client.query(`
      ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('  ✓ AdminUser.forcePasswordReset');

    await client.query(`
      ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('  ✓ Customer.points');

    await client.query(`
      ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3);
    `);
    console.log('  ✓ Customer.lastLogin');

    await client.query(`
      ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('  ✓ Customer.forcePasswordReset');

    // Add OUT_FOR_DELIVERY to enum (conditional - may fail silently if exists)
    try {
      const enumCheck = await client.query(`
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'OUT_FOR_DELIVERY'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')
      `);
      if (enumCheck.rowCount === 0) {
        await client.query(`ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY' AFTER 'SHIPPED';`);
        console.log('  ✓ OrderStatus enum: OUT_FOR_DELIVERY added');
      } else {
        console.log('  ✓ OrderStatus.OUT_FOR_DELIVERY (already exists)');
      }
    } catch (e) {
      console.log('  ⚠️  Could not add OUT_FOR_DELIVERY (may already exist or enum locked in transaction)');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS "RewardTransaction" (
        "id" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "points" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('  ✓ RewardTransaction table');

    // Add FK only if it doesn't exist
    const fkCheck = await client.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'RewardTransaction_customerId_fkey'
    `);
    if (fkCheck.rowCount === 0) {
      await client.query(`
        ALTER TABLE "RewardTransaction"
          ADD CONSTRAINT "RewardTransaction_customerId_fkey"
          FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('  ✓ RewardTransaction FK');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS "BundleOffer" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "minItems" INTEGER NOT NULL,
        "fixedPrice" DOUBLE PRECISION NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BundleOffer_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('  ✓ BundleOffer table');

    // ── Step 2: Reset super admin password ───────────────────────────────
    console.log('\n🔑  Resetting super admin password...');

    const email = 'admin@siddhamwellness.com';
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const existing = await client.query(
      `SELECT id, email, role FROM "AdminUser" WHERE email = $1`,
      [email]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      await client.query(
        `UPDATE "AdminUser" SET password = $1, role = 'super_admin', "forcePasswordReset" = false, "updatedAt" = now() WHERE email = $2`,
        [hashedPassword, email]
      );
      console.log(`  ✓ Password reset for ${email} → Admin@123`);
      console.log(`  ✓ Role set to super_admin`);
    } else {
      // Create fresh super admin
      await client.query(
        `INSERT INTO "AdminUser" (id, email, password, name, role, "forcePasswordReset", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'Super Admin', 'super_admin', false, now(), now())`,
        [email, hashedPassword]
      );
      console.log(`  ✓ Super admin created: ${email} → Admin@123`);
    }

    // ── Step 3: Show all admins ───────────────────────────────────────────
    console.log('\n📋  Current admin users:');
    const admins = await client.query(`SELECT email, name, role, "createdAt" FROM "AdminUser" ORDER BY "createdAt"`);
    admins.rows.forEach(a => console.log(`  • ${a.email} [${a.role}] — ${a.name}`));

    client.release();
    console.log('\n✅  All done! Deploy a new build to apply migration history tracking.\n');

  } catch (err) {
    console.error('\n❌  Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
