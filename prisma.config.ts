import { defineConfig } from 'prisma/config';

// Prisma 7 config - datasource URL set here for migrate commands
export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://siddham_user:siddham_pass@localhost:5432/siddham_db',
  },
});
