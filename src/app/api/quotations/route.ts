import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, AuthError } from '@/lib/auth';
import { CalculationEngine } from '@/services/calculation-engine';
import { QuotationEngine } from '@/services/quotation-engine';
import { BomGenerator } from '@/services/bom-generator';
import { parseDeductionProfile } from '@/types/deduction';

// قبول كلا الاسمين للتوافق مع العملاء القديمة والجديدة
const CostMatrixSchema = z
  .object({
    aluminumPerBar: z.number().positive().optional(),
    aluminumPerBar6M: z.number().positive().optional(),
    glassPerSQM: z.number().positive(),
    spacerPerMeter: z.number().min(0),
    siliconePerMeter: z.number().min(0),
    hingeUnitCost: z.number().min(0),
    rollerUnitCost: z.number().min(0),
    lockUnitCost: z.number().min(0),
    gasketPerMeter: z.number().min(0),
    bottomRailCost: z.number().min(0).optional(),
  })
  .transform((data) => ({
    ...data,
    // aluminumPerBar6M كاسم احتياطي لدعم الطلبات القادمة من الواجهات القديمة
    aluminumPerBar: data.aluminumPerBar ?? data.aluminumPerBar6M ?? 0,
  }))
  .refine((data) => data.aluminumPerBar > 0, {
    message: 'يجب تحديد تكلفة العود (aluminumPerBar أو aluminumPerBar6M)',
    path: ['aluminumPerBar'],
  });

const CreateQuotationSchema = z.object({
  projectId: z.string().uuid(),
  deductionProfileId: z.string().uuid(),
  width: z.number().positive().max(12000),
  height: z.number().positive().max(8000),
  panelsCount: z.number().int().min(1).max(8),
  mullionsCount: z.number().int().min(0).max(10).default(0),
  transomsCount: z.number().int().min(0).max(10).default(0),
  quantity: z.number().int().min(1).max(500),
  glassSpecification: z.string().min(1),
  profitMarginPercent: z.number().min(0).max(100).default(15),
  laborCostPerUnit: z.number().min(0),
  installationCostPerUnit: z.number().min(0),
  stockBarLength: z.number().positive().default(5800),
  costMatrix: CostMatrixSchema,
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSession();
    const body = CreateQuotationSchema.parse(await req.json());

    const rawProfile = await prisma.deductionProfile.findFirst({
      where: { id: body.deductionProfileId, tenantId: actor.tenantId },
    });
    if (!rawProfile) {
      return NextResponse.json({ error: 'مصفوفة الخصميات غير موجودة' }, { status: 404 });
    }
    const profile = parseDeductionProfile(rawProfile);

    // 1) محرك الحسابات الهندسية + التقطيع الأمثل بطول العود المحدد
    const calcResult = CalculationEngine.calculate({
      width: body.width,
      height: body.height,
      panelsCount: body.panelsCount,
      mullionsCount: body.mullionsCount,
      transomsCount: body.transomsCount,
      quantity: body.quantity,
      profile,
      stockBarLength: body.stockBarLength,
      costMatrix: body.costMatrix,
    });

    if (calcResult.nesting.oversizeCuts.length > 0) {
      return NextResponse.json(
        {
          error: `توجد ${calcResult.nesting.oversizeCuts.length} قطعة أطول من العود (${body.stockBarLength} مم) — تتطلب طلب توريد مخصص`,
          oversizeCuts: calcResult.nesting.oversizeCuts,
        },
        { status: 422 }
      );
    }

    // 2) محرك التسعير والضريبة
    const bill = QuotationEngine.calculateBill({
      calcResult,
      profitMarginPercent: body.profitMarginPercent,
      laborCostPerUnit: body.laborCostPerUnit,
      installationCostPerUnit: body.installationCostPerUnit,
      quantity: body.quantity,
    });

    // 3) حفظ العرض + البند + الـ BOM داخل معاملة
    const nextVersion = await prisma.quotation.count({ where: { projectId: body.projectId } });

    const quotation = await prisma.quotation.create({
      data: {
        projectId: body.projectId,
        version: nextVersion + 1,
        totalMaterial: bill.rawMaterialCost,
        totalLabor: bill.totalLaborCost,
        totalInstallation: bill.totalInstallationCost,
        profitMargin: body.profitMarginPercent,
        vatAmount: bill.vatAmount,
        finalPrice: bill.grandTotal,
        items: {
          create: {
            deductionProfileId: body.deductionProfileId,
            width: body.width,
            height: body.height,
            quantity: body.quantity,
            glassSpecification: body.glassSpecification,
            gridConfiguration: {
              panelsCount: body.panelsCount,
              mullionsCount: body.mullionsCount,
              transomsCount: body.transomsCount,
            },
            calculatedCost: bill.grandTotal,
          },
        },
      },
    });

    const bomItems = BomGenerator.buildDraft(calcResult, profile.systemName, body.glassSpecification, {
      aluminumPerBar6M: body.costMatrix.aluminumPerBar,
      glassPerSQM: body.costMatrix.glassPerSQM,
    });
    await BomGenerator.persist(quotation.id, bomItems);

    return NextResponse.json({ quotation, bill, calcResult }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[POST /api/quotations]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
