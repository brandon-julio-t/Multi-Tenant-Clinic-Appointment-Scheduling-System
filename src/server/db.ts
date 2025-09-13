import { PrismaClient } from "@prisma/client";

import { env } from "~/env";
import { RetryTransactions } from "./prisma-extensions/retry-transactions";

const createPrismaClient = () =>
  new PrismaClient({
    transactionOptions: {
      isolationLevel: "Serializable",
    },
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends(
    RetryTransactions({
      jitter: "full",
      numOfAttempts: 10,
    }),
  ) as unknown as PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
