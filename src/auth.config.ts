import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/types';

/**
 * Minimal auth config — NO Prisma imports.
 * This file is safe for the Edge runtime (middleware).
 * The full config with the Credentials provider lives in src/lib/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role: UserRole }).role;
        token.tenantId = (user as { tenantId: string }).tenantId;
        token.tenantName = (user as { tenantName: string }).tenantName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as UserRole;
      session.user.tenantId = token.tenantId as string;
      session.user.tenantName = token.tenantName as string;
      return session;
    },
  },
};
