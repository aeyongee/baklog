import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  // Connection pooling 설정 (Neon 최적화)
  const pool = globalForPrisma.pgPool || new Pool({
    connectionString,
    max: 1, // Vercel Serverless에서는 1개면 충분
    idleTimeoutMillis: 0, // 즉시 해제하지 않음
    connectionTimeoutMillis: 5000, // 5초로 단축
  });
  
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
