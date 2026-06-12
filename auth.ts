import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // وردية عمل 8 ساعات
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: { tenant: { select: { id: true, name: true } } },
        });
        if (!user) return null;

        const valid = await compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // عند تسجيل الدخول فقط: نقل بيانات المستأجر والدور إلى التوكن
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
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
});

// ===== أدوات الحماية لمسارات الـ API =====

export class AuthError extends Error {
  constructor(message: string, public readonly httpStatus: 401 | 403) {
    super(message);
  }
}

export interface SessionActor {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/** يُرجع هوية المستخدم الموثّقة أو يرمي AuthError 401 */
export async function requireSession(): Promise<SessionActor> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new AuthError('يتطلب تسجيل الدخول', 401);
  }
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  };
}

/** يتحقق من الجلسة + الدور — يرمي 403 إذا كان الدور غير مخوّل */
export async function requireRole(...roles: UserRole[]): Promise<SessionActor> {
  const actor = await requireSession();
  if (!roles.includes(actor.role)) {
    throw new AuthError(`هذه العملية تتطلب أحد الأدوار: ${roles.join('، ')}`, 403);
  }
  return actor;
}
