const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const SAUDI_VAT_RATE = 0.15;

export interface UnitPriceInput {
  rawMaterialCost: number;
  /** النسبة المئوية الأدنى المسموح بها للبيع فوق التكلفة — مثال: 20 يعني لا بيع أقل من التكلفة + 20% */
  floorPricePercentage: number;
  /** إضافة مخفية عن العميل — تُدمج في سعر الوحدة الظاهر */
  internalMarkupType: 'PERCENT' | 'FIXED' | null;
  internalMarkupValue: number;
  /** خصم ظاهر للعميل — يُعرض كبند منفصل في ورقة السعر */
  clientDiscountType: 'PERCENT' | 'FIXED' | null;
  clientDiscountValue: number;
}

export interface ClientBillOutput {
  /** السعر الظاهر للبند قبل الخصم — يتضمن الإضافة المخفية تلقائياً */
  displayUnitPriceBeforeDiscount: number;
  /** قيمة الخصم بالريال — تظهر في ورقة السعر للعميل */
  visibleDiscountAmount: number;
  /** الصافي قبل ضريبة القيمة المضافة */
  finalPriceToPayBeforeVAT: number;
  /** ضريبة القيمة المضافة 15% — لائحة هيئة الزكاة والضريبة والجمارك */
  vatAmount15: number;
  /** الإجمالي الشامل للدفع */
  grandTotal: number;
  /** تحذير: السعر أقل من الحد الأدنى المحدد من صاحب المصنع */
  isBelowFloorPrice: boolean;
  absoluteFloorPrice: number;
}

export class PricingEngine {
  /**
   * يحسب الفاتورة النهائية للبند مع منطق التسعير المزدوج:
   * - الإضافة المخفية: تُرفع سعر الوحدة دون إظهارها للعميل
   * - الخصم الظاهر: يُخصم من السعر ويُعرض صراحةً في الفاتورة
   * - حماية Floor Price: إنذار إذا نزل السعر تحت الحد الأدنى
   */
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
