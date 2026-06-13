import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, AuthError } from '@/lib/auth';
import type { ProjectStatus } from '@/types';

const CreateProjectSchema = z.object({
  name: z.string().min(2, 'اسم المشروع حرفان على الأقل'),
  clientId: z.string().uuid(),
});

const STATUS_VALUES = ['DRAFT', 'QUOTED', 'APPROVED', 'PRODUCTION', 'INSTALLATION', 'COMPLETED'] as const;

export async function GET(req: NextRequest) {
  try {
    const actor = await requireSession();
    const sp = req.nextUrl.searchParams;
    const status = sp.get('status') as ProjectStatus | null;
    const q = sp.get('q')?.trim();

    if (status && !STATUS_VALUES.includes(status)) {
      return NextResponse.json({ error: `حالة غير صالحة — القيم المتاحة: ${STATUS_VALUES.join('، ')}` }, { status: 400 });
    }

    const projects = await prisma.project.findMany({
      where: {
        tenantId: actor.tenantId,
        ...(status && { status }),
        ...(q && { name: { contains: q, mode: 'insensitive' } }),
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        quotations: {
          select: { id: true, version: true, finalPrice: true, isApproved: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ projects });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    console.error('[GET /api/projects]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSession();
    const body = CreateProjectSchema.parse(await req.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, tenantId: actor.tenantId },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ error: 'العميل غير موجود ضمن هذا المصنع' }, { status: 404 });

    const project = await prisma.project.create({
      data: { name: body.name, clientId: body.clientId, tenantId: actor.tenantId },
      include: { client: { select: { name: true } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[POST /api/projects]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
