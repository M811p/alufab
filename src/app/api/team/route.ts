import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, AuthError } from '@/lib/auth';

/**
 * GET /api/team
 * قائمة أعضاء الفريق + الدعوات المعلّقة. متاحة للـ ADMIN والـ MANAGER.
 */
export async function GET() {
  try {
    const actor = await requireRole('ADMIN', 'MANAGER');

    const [users, pendingInvitations] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId: actor.tenantId },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.invitation.findMany({
        where: { tenantId: actor.tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ users, pendingInvitations });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    console.error('[GET /api/team]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
