import { prisma } from '@/lib/prisma';
import { CalculationResult } from './calculation-engine';

export interface BomDraftItem {
  category: 'PROFILE' | 'GLASS' | 'HARDWARE' | 'ACCESSORY';
  itemName: string;
  quantity: number;
  unit: 'BAR' | 'SQM' | 'PC' | 'MTR';
  unitCost: number;
  totalCost: number;
  cuttingList?: { length: number; count: number; label: string }[];
}

export class BomGenerator {
  public static buildDraft(
    calc: CalculationResult,
    systemName: string,
    glassLabel: string,
    unitCosts: { aluminumPerBar6M: number; glassPerSQM: number }
  ): BomDraftItem[] {
    const items: BomDraftItem[] = [];

    items.push({
      category: 'PROFILE',
      itemName: `قطاع ألمنيوم خام 6 متر — ${systemName}`,
      quantity: calc.bars6MRequired,
      unit: 'BAR',
      unitCost: unitCosts.aluminumPerBar6M,
      totalCost: calc.costBreakdown.aluminumCost,
      cuttingList: calc.aluminumCuttingList.map((c) => ({
        length: c.length,
        count: c.count,
        label: c.label,
      })),
    });

    items.push({
      category: 'GLASS',
      itemName: glassLabel,
      quantity: calc.glassDimensions.totalAreaSQM,
      unit: 'SQM',
      unitCost: unitCosts.glassPerSQM,
      totalCost: calc.glassDimensions.totalAreaSQM * unitCosts.glassPerSQM,
    });

    if (calc.glassDimensions.totalSpacerMeters > 0) {
      items.push({
        category: 'ACCESSORY',
        itemName: 'فاصل ألمنيوم (Spacer Bar) للزجاج المزدوج',
        quantity: calc.glassDimensions.totalSpacerMeters,
        unit: 'MTR',
        unitCost: 0,
        totalCost: 0,
      });
      items.push({
        category: 'ACCESSORY',
        itemName: 'سيليكون هيكلي / بيوتيل DGU',
        quantity: calc.glassDimensions.totalSiliconeMeters,
        unit: 'MTR',
        unitCost: 0,
        totalCost: 0,
      });
    }

    const hw = calc.hardwareCounts;
    if (hw.hinges > 0)
      items.push({ category: 'HARDWARE', itemName: 'مفصلات', quantity: hw.hinges, unit: 'PC', unitCost: 0, totalCost: 0 });
    if (hw.rollers > 0)
      items.push({ category: 'HARDWARE', itemName: 'بكرات سحاب', quantity: hw.rollers, unit: 'PC', unitCost: 0, totalCost: 0 });
    if (hw.locks > 0)
      items.push({ category: 'HARDWARE', itemName: 'أقفال', quantity: hw.locks, unit: 'PC', unitCost: 0, totalCost: 0 });
    if (hw.gasketMeters > 0)
      items.push({ category: 'ACCESSORY', itemName: 'كاوتشوك (Gasket)', quantity: hw.gasketMeters, unit: 'MTR', unitCost: 0, totalCost: 0 });

    return items;
  }

  public static async persist(quotationId: string, items: BomDraftItem[], wasteFactor = 10.0) {
    return prisma.$transaction(async (tx) => {
      await tx.bOM.deleteMany({ where: { quotationId } });
      const bom = await tx.bOM.create({ data: { quotationId, wasteFactor } });

      for (const item of items) {
        const created = await tx.bOMItem.create({
          data: {
            bomId: bom.id,
            category: item.category,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
          },
        });
        if (item.cuttingList?.length) {
          await tx.cuttingListElement.createMany({
            data: item.cuttingList.map((c) => ({ bomItemId: created.id, ...c })),
          });
        }
      }
      return bom;
    });
  }

  public static async deductInventoryOnApproval(tenantId: string, quotationId: string) {
    const bom = await prisma.bOM.findUnique({
      where: { quotationId },
      include: { items: true },
    });
    if (!bom) throw new Error('لا توجد قائمة مواد (BOM) لهذا العرض — يجب توليدها قبل الاعتماد');

    return prisma.$transaction(
      bom.items.map((item) =>
        prisma.inventoryItem.updateMany({
          where: { tenantId, name: item.itemName },
          data: { stockLevel: { decrement: item.quantity } },
        })
      )
    );
  }

  public static async restockInventoryOnReversal(tenantId: string, quotationId: string) {
    const bom = await prisma.bOM.findUnique({
      where: { quotationId },
      include: { items: true },
    });
    if (!bom) return;

    return prisma.$transaction(
      bom.items.map((item) =>
        prisma.inventoryItem.updateMany({
          where: { tenantId, name: item.itemName },
          data: { stockLevel: { increment: item.quantity } },
        })
      )
    );
  }
}
