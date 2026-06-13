import { prisma } from '@/lib/prisma';
import { BomGenerator } from './bom-generator';
import type { ProjectStatus, UserRole } from '@/types';

const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['QUOTED'],
  QUOTED: ['APPROVED', 'DRAFT'],
  APPROVED: ['PRODUCTION', 'QUOTED'],
  PRODUCTION: ['INSTALLATION'],
  INSTALLATION: ['COMPLETED'],
  COMPLETED: [],
};

const TRANSITION_ROLES: Record<string, UserRole[]> = {
  'DRAFT>QUOTED': ['ESTIMATOR', 'MANAGER', 'ADMIN'],
  'QUOTED>DRAFT': ['ESTIMATOR', 'MANAGER', 'ADMIN'],
  'QUOTED>APPROVED': ['MANAGER', 'ADMIN'],
  'APPROVED>QUOTED': ['MANAGER', 'ADMIN'],
  'APPROVED>PRODUCTION': ['PRODUCTION', 'MANAGER', 'ADMIN'],
  'PRODUCTION>INSTALLATION': ['PRODUCTION', 'MANAGER', 'ADMIN'],
  'INSTALLATION>COMPLETED': ['MANAGER', 'ADMIN'],
};

export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_FOUND'
      | 'INVALID_TRANSITION'
      | 'FORBIDDEN_ROLE'
      | 'MISSING_QUOTATION'
      | 'MISSING_BOM'
      | 'INSUFFICIENT_STOCK',
    public readonly httpStatus: number,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export interface TransitionContext {
  projectId: string;
  tenantId: string;
  targetStatus: ProjectStatus;
  actorRole: UserRole;
  allowNegativeStock?: boolean;
}

export interface TransitionResult {
  projectId: string;
  previousStatus: ProjectStatus;
  newStatus: ProjectStatus;
  inventoryEffect: 'DEDUCTED' | 'RESTOCKED' | 'NONE';
  warnings: string[];
}

export class ProjectWorkflow {
  public static canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  public static roleAllowed(from: ProjectStatus, to: ProjectStatus, role: UserRole): boolean {
    return TRANSITION_ROLES[`${from}>${to}`]?.includes(role) ?? false;
  }

  public static async transition(ctx: TransitionContext): Promise<TransitionResult> {
    const project = await prisma.project.findFirst({
      where: { id: ctx.projectId, tenantId: ctx.tenantId },
      include: {
        quotations: {
          orderBy: { version: 'desc' },
          take: 1,
          include: { bom: { include: { items: true } } },
        },
      },
    });

    if (!project) {
      throw new WorkflowError('المشروع غير موجود ضمن هذا المصنع', 'NOT_FOUND', 404);
    }

    const from = project.status as ProjectStatus;
    const to = ctx.targetStatus;

    if (from === to) {
      throw new WorkflowError(`المشروع بالفعل في حالة ${to}`, 'INVALID_TRANSITION', 409);
    }
    if (!this.canTransition(from, to)) {
      throw new WorkflowError(
        `الانتقال من ${from} إلى ${to} غير مسموح — الانتقالات المتاحة: ${ALLOWED_TRANSITIONS[from].join('، ') || 'لا شيء'}`,
        'INVALID_TRANSITION',
        409
      );
    }
    if (!this.roleAllowed(from, to, ctx.actorRole)) {
      throw new WorkflowError(
        `دور ${ctx.actorRole} غير مخوّل بهذا الانتقال — الأدوار المسموحة: ${TRANSITION_ROLES[`${from}>${to}`].join('، ')}`,
        'FORBIDDEN_ROLE',
        403
      );
    }

    const latestQuotation = project.quotations[0];
    const warnings: string[] = [];
    let inventoryEffect: TransitionResult['inventoryEffect'] = 'NONE';

    if (to === 'QUOTED' && from === 'DRAFT') {
      if (!latestQuotation) {
        throw new WorkflowError('لا يمكن نقل المشروع إلى "تم التسعير" بدون عرض سعر واحد على الأقل', 'MISSING_QUOTATION', 422);
      }
    }

    if (to === 'APPROVED') {
      if (!latestQuotation?.bom) {
        throw new WorkflowError('يجب توليد قائمة المواد (BOM) قبل اعتماد المشروع', 'MISSING_BOM', 422);
      }

      const shortages = await this.checkStockSufficiency(ctx.tenantId, latestQuotation.bom.items);
      if (shortages.length > 0 && !ctx.allowNegativeStock) {
        throw new WorkflowError('المخزون غير كافٍ لاعتماد المشروع', 'INSUFFICIENT_STOCK', 422, { shortages });
      }
      if (shortages.length > 0) {
        warnings.push(`تم الاعتماد مع عجز مخزون في ${shortages.length} صنف — أنشئ أوامر شراء`);
      }

      await BomGenerator.deductInventoryOnApproval(ctx.tenantId, latestQuotation.id);
      await prisma.quotation.update({ where: { id: latestQuotation.id }, data: { isApproved: true } });
      inventoryEffect = 'DEDUCTED';
    }

    if (from === 'APPROVED' && to === 'QUOTED') {
      if (latestQuotation?.bom) {
        await BomGenerator.restockInventoryOnReversal(ctx.tenantId, latestQuotation.id);
        await prisma.quotation.update({ where: { id: latestQuotation.id }, data: { isApproved: false } });
        inventoryEffect = 'RESTOCKED';
        warnings.push('أُعيدت كميات المواد المخصومة إلى المخزون');
      }
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { status: to },
    });

    return {
      projectId: updated.id,
      previousStatus: from,
      newStatus: to,
      inventoryEffect,
      warnings,
    };
  }

  private static async checkStockSufficiency(
    tenantId: string,
    bomItems: { itemName: string; quantity: number }[]
  ): Promise<{ itemName: string; required: number; available: number }[]> {
    const names = bomItems.map((i) => i.itemName);
    const stock = await prisma.inventoryItem.findMany({
      where: { tenantId, name: { in: names } },
      select: { name: true, stockLevel: true },
    });
    const stockMap = new Map(stock.map((s) => [s.name, s.stockLevel]));

    const shortages: { itemName: string; required: number; available: number }[] = [];
    for (const item of bomItems) {
      const available = stockMap.get(item.itemName);
      if (available !== undefined && available < item.quantity) {
        shortages.push({ itemName: item.itemName, required: item.quantity, available });
      }
    }
    return shortages;
  }
}
