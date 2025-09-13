import { Prisma } from "@prisma/client";
import { backOff, type IBackOffOptions } from "exponential-backoff";

/**
 * @docs https://github.com/prisma/prisma-client-extensions/blob/main/retry-transactions/script.ts
 */
export function RetryTransactions(options?: Partial<IBackOffOptions>) {
  return Prisma.defineExtension((prisma) =>
    prisma.$extends({
      client: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $transaction(...args: any) {
          // eslint-disable-next-line prefer-spread, @typescript-eslint/no-unsafe-argument
          return backOff(() => prisma.$transaction.apply(prisma, args), {
            retry: (e) => {
              // Retry the transaction only if the error was due to a write conflict or deadlock
              // See: https://www.prisma.io/docs/reference/api-reference/error-reference#p2034
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              return e.code === "P2034";
            },
            ...options,
          });
        },
      } as { $transaction: (typeof prisma)["$transaction"] },
    }),
  );
}
