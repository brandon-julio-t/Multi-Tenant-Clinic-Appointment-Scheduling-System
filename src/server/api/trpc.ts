/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { type OpenApiMeta } from "trpc-to-openapi";
import { ZodError } from "zod";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  openapi?: boolean;
}) => {
  // Get session from the headers
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  if (opts.openapi && t._config.isDev) {
    const [mockSession, mockUser] = await db.$transaction([
      db.session.findFirst({
        where: { userId: "user_admin_1" },
      }),
      db.user.findFirst({
        where: { id: "user_admin_1" },
      }),
    ]);

    console.log("mockSession", mockSession);
    console.log("mockUser", mockUser);

    return {
      db,
      session: {
        session: mockSession!,
        user: mockUser!,
      } satisfies typeof session,
      ...opts,
    };
  }

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC
  .context<typeof createTRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  const result = await next();
  const realEnd = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const end = Date.now();
  console.log(
    `[TRPC] ${path} took ${end - start}ms to execute (real: ${realEnd - start}ms)`,
  );

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Authentication middleware
 *
 * This middleware checks if the user is authenticated and throws an error if not.
 * It also provides type safety for the session in protected procedures.
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * This procedure guarantees that the user is authenticated and provides access to their session.
 * Use this for any operations that require a logged-in user.
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware);

/**
 * Organization middleware
 *
 * This middleware checks if the user has an active organization and throws an error if not.
 * It builds upon the authMiddleware to ensure both authentication and organization context.
 */
const orgMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.session?.activeOrganizationId) {
    throw new Error("ORGANIZATION_REQUIRED");
  }

  const organization = await ctx.db.organization.findUniqueOrThrow({
    where: {
      id: ctx.session.session.activeOrganizationId,
    },
    select: {
      metadata: true,
    },
  });

  const metadata = organization.metadata ?? "{}";

  const metadataJson = JSON.parse(metadata) as {
    timezone: string;
  };

  return next({
    ctx: {
      session: ctx.session,
      activeOrganizationId: ctx.session.session.activeOrganizationId,
      organizationTimezone: metadataJson.timezone,
    },
  });
});

/**
 * Protected organization procedure
 *
 * This procedure guarantees that:
 * 1. The user is authenticated
 * 2. The user has an active organization
 * 3. Provides access to both the session and active organization ID
 *
 * Use this for operations that require both authentication and organization context.
 */
export const protectedOrgProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware)
  .use(orgMiddleware);
