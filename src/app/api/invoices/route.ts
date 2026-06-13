import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole, AuthError } from '@/lib/auth';
import { SAUDI_VAT_RATE } from '@/services/quotation-engine';

const CreateInvoiceSchema = z.object({ quotationId: z.string().uuid() });
const UpdateInvoiceSchema = z.object({ invoiceId: z.string().uuid(), isPaid: z.boolean() });

async function nextInvoiceNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], tenantId: string) {
  const year = new Date().getFullYear();
  const count = await tx.invoice.count({
    where: { invoiceNo: { startsWith: `INV-${year}-` }, quotation: { project: { tenantId } } },
  });
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireSession();
    const unpaidOnly = req.nextUrl.searchParams.get('unpaid') === 'true';

    const invoices = await prisma.invoice.findMany({
      where: {
        quotation: { project: { tenantId: actor.tenantId } },
        ...(unpaidOnly && { isPaid: false }),
      },
      include: {
        quotation: {
          select: { project: { select: { name: true, client: { select: { name: true, phone: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ invoices });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    console.error('[GET /api/invoices]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole('ESTIMATOR', 'MANAGER', 'ADMIN');
    const body = CreateInvoiceSchema.parse(await req.json());

    const quotation = await prisma.quotation.findFirst({
      where: { id: body.quotationId, project: { tenantId: actor.tenantId } },
      select: { id: true, isApproved: true, finalPrice: true, vatAmount: true },
    });
    if (!quotation) return NextResponse.json({ error: 'عرض السعر غير موجود' }, { status: 404 });
    if (!quotation.isApproved) {
      return NextResponse.json({ error: 'لا يمكن إصدار فاتورة لعرض غير معتمد — اعتمد المشروع أولاً' }, { status: 422 });
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNo = await nextInvoiceNumber(tx, actor.tenantId);
      return tx.invoice.create({
        data: {
          quotationId: quotation.id,
          invoiceNo,
          amountDue: quotation.finalPrice - quotation.vatAmount,
          taxAmount: quotation.vatAmount,
          grandTotal: quotation.finalPrice,
        },
      });
    }, { isolationLevel: 'Serializable' });

    return NextResponse.json({ invoice, vatRate: SAUDI_VAT_RATE }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[POST /api/invoices]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireRole('MANAGER', 'ADMIN');
    const body = UpdateInvoiceSchema.parse(await req.json());

    const invoice = await prisma.invoice.findFirst({
      where: { id: body.invoiceId, quotation: { project: { tenantId: actor.tenantId } } },
      select: { id: true },
    });
    if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { isPaid: body.isPaid },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[PATCH /api/invoices]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
