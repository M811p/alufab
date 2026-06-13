import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string;
      tenantName: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    tenantId: string;
    tenantName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
  }
}
