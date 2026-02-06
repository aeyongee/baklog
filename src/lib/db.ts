import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

function createPrismaClient() {
  // Connection pooling 설정 (Neon 최적화)
  const pool = globalForPrisma.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // 최대 연결 수
    idleTimeoutMillis: 30000, // 30초 유휴 타임아웃
    connectionTimeoutMillis: 10000, // 10초 연결 타임아웃
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
