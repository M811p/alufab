import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole, AuthError } from '@/lib/auth';

const UpdateSchema = z
  .object({
    role: z.enum(['ADMIN', 'MANAGER', 'ESTIMATOR', 'DESIGNER', 'PRODUCTION']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.role !== undefined || d.isActive !== undefined, {
    message: 'يجب تحديد role أو isActive على الأقل',
  });

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireRole('ADMIN');
    const { id } = await params;
    const body = UpdateSchema.parse(await req.json());

    const target = await prisma.user.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: { id: true, role: true, isActive: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'المستخدم غير موجود ضمن هذا المصنع' }, { status: 404 });
    }

    if (target.id === actor.userId) {
      return NextResponse.json({ error: 'لا يمكنك تعديل دورك أو حالتك بنفسك — اطلب من مدير نظام آخر' }, { status: 409 });
    }

    const demotingAdmin = target.role === 'ADMIN' && body.role !== undefined && body.role !== 'ADMIN';
    const deactivatingAdmin = target.role === 'ADMIN' && body.isActive === false;

    // Wrap the last-admin guard + update in a serializable transaction to prevent TOCTOU race.
    const updated = await prisma.$transaction(
      async (tx) => {
        if (demotingAdmin || deactivatingAdmin) {
          const activeAdmins = await tx.user.count({
            where: { tenantId: actor.tenantId, role: 'ADMIN', isActive: true, NOT: { id: target.id } },
          });
          if (activeAdmins === 0) {
            throw new Error('LAST_ADMIN');
          }
        }
        return tx.user.update({
          where: { id: target.id },
          data: {
            ...(body.role ? { role: body.role } : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          },
          select: { id: true, name: true, email: true, role: true, isActive: true },
        });
      },
      { isolationLevel: 'Serializable' }
    );

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'LAST_ADMIN') {
      return NextResponse.json({ error: 'لا يمكن إزالة آخر مدير نظام نشط في المصنع' }, { status: 409 });
    }
    console.error('[PATCH /api/team/:id]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireRole('ADMIN');
    const { id } = await params;

    const target = await prisma.user.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: { id: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'المستخدم غير موجود ضمن هذا المصنع' }, { status: 404 });
    }
    if (target.id === actor.userId) {
      return NextResponse.json({ error: 'لا يمكنك تعطيل حسابك بنفسك' }, { status: 409 });
    }

    await prisma.$transaction(
      async (tx) => {
        if (target.role === 'ADMIN') {
          const activeAdmins = await tx.user.count({
            where: { tenantId: actor.tenantId, role: 'ADMIN', isActive: true, NOT: { id: target.id } },
          });
          if (activeAdmins === 0) throw new Error('LAST_ADMIN');
        }
        await tx.user.update({ where: { id: target.id }, data: { isActive: false } });
      },
      { isolationLevel: 'Serializable' }
    );
    return NextResponse.json({ message: 'تم تعطيل العضو — يمكن إعادة تفعيله لاحقاً' });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    if (err instanceof Error && err.message === 'LAST_ADMIN') {
      return NextResponse.json({ error: 'لا يمكن تعطيل آخر مدير نظام نشط في المصنع' }, { status: 409 });
    }
    console.error('[DELETE /api/team/:id]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
