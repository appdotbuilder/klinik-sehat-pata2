import { initTRPC, TRPCError } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  loginInputSchema,
  createUserInputSchema,
  updateUserInputSchema,
  changePasswordInputSchema
} from './schema';

// Import handlers
import { login } from './handlers/login';
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { changePassword } from './handlers/change_password';
import { getAdminDashboard } from './handlers/get_admin_dashboard';
import { getDokterDashboard } from './handlers/get_dokter_dashboard';
import { getResepsionisData } from './handlers/get_resepsionis_dashboard';
import { verifyAuth, requireRole } from './handlers/verify_auth';

// Create TRPC context
interface Context {
  authToken?: string;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Protected procedure that requires authentication
const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.authToken) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token required' });
  }
  
  const session = await verifyAuth(ctx.authToken);
  if (!session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
  
  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user_role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next();
});

// Doctor-only procedure
const dokterProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user_role !== 'dokter') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Doctor access required' });
  }
  return next();
});

// Receptionist-only procedure
const resepsioniseProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user_role !== 'resepsionis') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Receptionist access required' });
  }
  return next();
});

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // User management routes (Admin only)
  createUser: adminProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUsers: adminProcedure
    .query(() => getUsers()),

  updateUser: adminProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Password change (All authenticated users)
  changePassword: protectedProcedure
    .input(changePasswordInputSchema)
    .mutation(({ input }) => changePassword(input)),

  // Dashboard routes - role-based access
  getAdminDashboard: adminProcedure
    .query(() => getAdminDashboard()),

  getDokterDashboard: dokterProcedure
    .query(({ ctx }) => getDokterDashboard(ctx.session.user_id)),

  getResepsionisData: resepsioniseProcedure
    .query(({ ctx }) => getResepsionisData(ctx.session.user_id)),

  // Auth verification
  verifyToken: protectedProcedure
    .query(({ ctx }) => ({
      valid: true,
      user_id: ctx.session.user_id,
      role: ctx.session.user_role
    })),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext({ req }): Context {
      // Extract auth token from Authorization header
      const authHeader = req.headers.authorization;
      const authToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : undefined;
      
      return {
        authToken,
      };
    },
  });
  server.listen(port);
  console.log(`Klinik Sehat Pata2 TRPC server listening at port: ${port}`);
}

start();