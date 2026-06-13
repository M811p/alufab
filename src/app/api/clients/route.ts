import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, AuthError } from '@/lib/auth';
import { WhatsAppService } from '@/services/whatsapp-service';

const ClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9, 'رقم جوال غير صالح'),
  email: z.string().email().optional().nullable(),
  companyName: z.string().optional().nullable(),
});

/** GET /api/clients?q=بحث — قائمة العملاء مع آخر مشاريعهم */
export async function GET(req: NextRequest) {
  try {
    const actor = await requireSession();
    const q = req.nextUrl.searchParams.get('q')?.trim();

    const clients = await prisma.client.findMany({
      where: {
        tenantId: actor.tenantId,
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { companyName: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        projects: {
          select: { id: true, name: true, status: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ clients });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    console.error('[GET /api/clients]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/** POST /api/clients — إضافة عميل (الجوال يُطبَّع لصيغة دولية للواتساب) */
export async function POST(req: NextRequest) {
  try {
    const actor = await requireSession();
    const body = ClientSchema.parse(await req.json());

    const client = await prisma.client.create({
      data: {
        ...body,
        phone: WhatsAppService.normalizePhone(body.phone),
        tenantId: actor.tenantId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[POST /api/clients]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
