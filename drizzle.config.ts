// import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// config({ path: '.env.local' });

export default defineConfig({
    out: './db/drizzle',
    schema: './db/schema/*',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
