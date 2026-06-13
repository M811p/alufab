import { z } from 'zod';

export type SystemType = 'SLIDING' | 'HINGED' | 'FIXED' | 'CURTAIN_WALL';

export const HardwareFormulaRulesSchema = z.object({
  hinges: z.object({
    baseCount: z.number().int().min(0).default(2),
    perHeightLimit: z.number().positive().default(700),
  }),
  rollers: z.object({
    perPanelCount: z.number().int().min(0).default(2),
  }),
  locks: z.object({
    perSashCount: z.number().int().min(0).default(1),
  }),
  siliconeAndGaskets: z.object({
    wasteMultiplier: z.number().min(1).max(2).default(1.05),
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

export function parseDeductionProfile(raw: unknown): IDeductionProfile {
  const base = raw as Omit<IDeductionProfile, 'hardwareFormulaRules'> & {
    hardwareFormulaRules: unknown;
  };
  return {
    ...base,
    hardwareFormulaRules: HardwareFormulaRulesSchema.parse(base.hardwareFormulaRules),
  };
}
