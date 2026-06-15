const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const SAUDI_VAT_RATE = 0.15;

export interface UnitPriceInput {
  rawMaterialCost: number;
  floorPricePercentage: number;
  internalMarkupType: 'PERCENT' | 'FIXED' | null;
  internalMarkupValue: number;
  clientDiscountType: 'PERCENT' | 'FIXED' | null;
  clientDiscountValue: number;
}

export interface ClientBillOutput {
  displayUnitPriceBeforeDiscount: number;
  visibleDiscountAmount: number;
  finalPriceToPayBeforeVAT: number;
  vatAmount15: number;
  grandTotal: number;
  isBelowFloorPrice: boolean;
  absoluteFloorPrice: number;
}

export class PricingEngine {
  public static calculateLineItemInvoice(input: UnitPriceInput): ClientBillOutput {
    const {
      rawMaterialCost,
      floorPricePercentage,
      internalMarkupType,
      internalMarkupValue,
      clientDiscountType,
      clientDiscountValue,
    } = input;

    const absoluteFloorPrice = round2(rawMaterialCost * (1 + floorPricePercentage / 100));

    let priceWithMarkup = rawMaterialCost;
    if (internalMarkupType === 'PERCENT') {
      priceWithMarkup = rawMaterialCost * (1 + internalMarkupValue / 100);
    } else if (internalMarkupType === 'FIXED') {
      priceWithMarkup = rawMaterialCost + internalMarkupValue;
    }

    let visibleDiscountAmount = 0;
    if (clientDiscountType === 'PERCENT') {
      visibleDiscountAmount = priceWithMarkup * (clientDiscountValue / 100);
    } else if (clientDiscountType === 'FIXED') {
      visibleDiscountAmount = clientDiscountValue;
    }

    const finalPriceToPayBeforeVAT = priceWithMarkup - visibleDiscountAmount;
    const vatAmount15 = finalPriceToPayBeforeVAT * SAUDI_VAT_RATE;
    const grandTotal = finalPriceToPayBeforeVAT + vatAmount15;

    return {
      displayUnitPriceBeforeDiscount: round2(priceWithMarkup),
      visibleDiscountAmount: round2(visibleDiscountAmount),
      finalPriceToPayBeforeVAT: round2(finalPriceToPayBeforeVAT),
      vatAmount15: round2(vatAmount15),
      grandTotal: round2(grandTotal),
      isBelowFloorPrice: finalPriceToPayBeforeVAT < absoluteFloorPrice,
      absoluteFloorPrice,
    };
  }

  public static formatSAR(amount: number): string {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
  }
}
