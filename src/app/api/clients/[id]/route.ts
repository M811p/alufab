import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole, AuthError } from '@/lib/auth';
import { WhatsAppService } from '@/services/whatsapp-service';

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(9).optional(),
  email: z.string().email().nullable().optional(),
  companyName: z.string().nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireSession();
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, tenantId: actor.tenantId },
      include: {
        projects: {
          include: { quotations: { select: { id: true, finalPrice: true, isApproved: true }, orderBy: { version: 'desc' }, take: 1 } },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
    if (!client) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });

    return NextResponse.json(client);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    console.error('[GET /api/clients/:id]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireSession();
    const { id } = await params;
    const body = UpdateSchema.parse(await req.json());

    const exists = await prisma.client.findFirst({ where: { id, tenantId: actor.tenantId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });

    const client = await prisma.client.update({
      where: { id },
      data: { ...body, ...(body.phone && { phone: WhatsAppService.normalizePhone(body.phone) }) },
    });
    return NextResponse.json(client);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[PATCH /api/clients/:id]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireRole('ADMIN', 'MANAGER');
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, tenantId: actor.tenantId },
      include: { _count: { select: { projects: true } } },
    });
    if (!client) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    if (client._count.projects > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف العميل — لديه ${client._count.projects} مشروع مرتبط بسجلات مالية` },
        { status: 409 }
      );
    }

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ message: 'تم حذف العميل' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    console.error('[DELETE /api/clients/:id]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
