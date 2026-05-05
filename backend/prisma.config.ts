import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ??
      'postgresql://user:123456@localhost:5432/chatbot_db?schema=public',
  },
});