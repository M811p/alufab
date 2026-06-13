import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, AuthError } from '@/lib/auth';
import { CalculationEngine } from '@/services/calculation-engine';
import { QuotationEngine } from '@/services/quotation-engine';
import { BomGenerator } from '@/services/bom-generator';
import { parseDeductionProfile } from '@/types/deduction';

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
  costMatrix: z.object({
    aluminumPerBar6M: z.number().positive(),
    glassPerSQM: z.number().positive(),
    spacerPerMeter: z.number().min(0),
    siliconePerMeter: z.number().min(0),
    hingeUnitCost: z.number().min(0),
    rollerUnitCost: z.number().min(0),
    lockUnitCost: z.number().min(0),
    gasketPerMeter: z.number().min(0),
  }),
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

    const calcResult = CalculationEngine.calculate({
      width: body.width,
      height: body.height,
      panelsCount: body.panelsCount,
      mullionsCount: body.mullionsCount,
      transomsCount: body.transomsCount,
      quantity: body.quantity,
      profile,
      costMatrix: body.costMatrix,
    });

    if (calcResult.nesting.oversizeCuts.length > 0) {
      return NextResponse.json(
        {
          error: 'توجد قطع أطول من القضيب القياسي 6 متر — تتطلب طلب خاص من المورد',
          oversizeCuts: calcResult.nesting.oversizeCuts,
        },
        { status: 422 }
      );
    }

    const bill = QuotationEngine.calculateBill({
      calcResult,
      profitMarginPercent: body.profitMarginPercent,
      laborCostPerUnit: body.laborCostPerUnit,
      installationCostPerUnit: body.installationCostPerUnit,
      quantity: body.quantity,
    });

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
      aluminumPerBar6M: body.costMatrix.aluminumPerBar6M,
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
