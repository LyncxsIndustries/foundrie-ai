import { config } from 'dotenv';
config({ path: '.env.local' });
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
  },
});
