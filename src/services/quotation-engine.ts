import { CalculationResult } from './calculation-engine';

export interface QuotationInput {
  calcResult: CalculationResult;
  profitMarginPercent: number;
  laborCostPerUnit: number;
  installationCostPerUnit: number;
  quantity: number;
}

export interface QuotationBill {
  rawMaterialCost: number;
  totalLaborCost: number;
  totalInstallationCost: number;
  subtotalBeforeMargin: number;
  profitAmount: number;
  subtotalWithMargin: number;
  vatAmount: number;
  grandTotal: number;
  pricePerSQM: number;
}

export const SAUDI_VAT_RATE = 0.15;

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export class QuotationEngine {
  public static calculateBill(input: QuotationInput): QuotationBill {
    const { calcResult, profitMarginPercent, laborCostPerUnit, installationCostPerUnit, quantity } = input;

    if (quantity < 1) throw new Error('الكمية يجب أن تكون 1 على الأقل');
    if (profitMarginPercent < 0) throw new Error('هامش الربح لا يمكن أن يكون سالباً');

    const rawMaterialCost = calcResult.costBreakdown.totalMaterialCost;
    const totalLaborCost = laborCostPerUnit * quantity;
    const totalInstallationCost = installationCostPerUnit * quantity;

    const subtotalBeforeMargin = rawMaterialCost + totalLaborCost + totalInstallationCost;
    const profitAmount = subtotalBeforeMargin * (profitMarginPercent / 100);
    const subtotalWithMargin = subtotalBeforeMargin + profitAmount;

    const vatAmount = subtotalWithMargin * SAUDI_VAT_RATE;
    const grandTotal = subtotalWithMargin + vatAmount;

    const totalArea = calcResult.glassDimensions.totalAreaSQM;
    const pricePerSQM = totalArea > 0 ? grandTotal / totalArea : 0;

    return {
      rawMaterialCost: round2(rawMaterialCost),
      totalLaborCost: round2(totalLaborCost),
      totalInstallationCost: round2(totalInstallationCost),
      subtotalBeforeMargin: round2(subtotalBeforeMargin),
      profitAmount: round2(profitAmount),
      subtotalWithMargin: round2(subtotalWithMargin),
      vatAmount: round2(vatAmount),
      grandTotal: round2(grandTotal),
      pricePerSQM: round2(pricePerSQM),
    };
  }

  public static formatSAR(amount: number): string {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
  }
}
