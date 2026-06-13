import { z } from 'zod';

export type SystemType = 'SLIDING' | 'HINGED' | 'FIXED' | 'CURTAIN_WALL';

// ===== Zod Schema: مصادقة بنية الـ Json القادمة من قاعدة البيانات =====
export const HardwareFormulaRulesSchema = z.object({
  hinges: z.object({
    baseCount: z.number().int().min(0).default(2),
    perHeightLimit: z.number().positive().default(700), // مفصلة إضافية لكل X مم ارتفاع
  }),
  rollers: z.object({
    perPanelCount: z.number().int().min(0).default(2),
  }),
  locks: z.object({
    perSashCount: z.number().int().min(0).default(1),
  }),
  siliconeAndGaskets: z.object({
    wasteMultiplier: z.number().min(1).max(2).default(1.05), // عامل هدر 5% افتراضي
  }),
});

export type HardwareFormulaRules = z.infer<typeof HardwareFormulaRulesSchema>;

export interface IDeductionProfile {
  id: string;
  tenantId: string;
  systemName: string;
  systemType: SystemType;
  frameToSashHorizontal: number;
  frameToSashVertical: number;
  mullionDeduction: number;
  transomDeduction: number;
  overlapAllowance: number;
  glassDeductionHorizontal: number;
  glassDeductionVertical: number;
  hardwareFormulaRules: HardwareFormulaRules;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * تستخدم عند قراءة DeductionProfile من Prisma حيث يكون hardwareFormulaRules
 * من نوع Prisma.JsonValue — تضمن سلامة البنية قبل دخولها لمحرك الحسابات.
 */
export function parseDeductionProfile(raw: unknown): IDeductionProfile {
  const base = raw as Omit<IDeductionProfile, 'hardwareFormulaRules'> & {
    hardwareFormulaRules: unknown;
  };
  return {
    ...base,
    hardwareFormulaRules: HardwareFormulaRulesSchema.parse(base.hardwareFormulaRules),
  };
}
