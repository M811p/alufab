import { QuotationBill, QuotationEngine } from './quotation-engine';

export interface WhatsAppQuoteParams {
  clientName: string;
  clientPhone: string; // أي صيغة: 05xxxxxxxx أو +9665xxxxxxxx أو 9665xxxxxxxx
  quotationNumber: string;
  systemName: string;
  glassLabel: string;
  dimensions: { width: number; height: number; qty: number };
  bill: QuotationBill;
  approvalUrl?: string; // رابط الاعتماد الإلكتروني للعميل
  companyName?: string;
}

export class WhatsAppService {
  /**
   * تطبيع رقم الجوال لصيغة wa.me الدولية (بدون + وبدون أصفار بادئة).
   * يدعم الصيغ السعودية الشائعة: 05xxxxxxxx ، 5xxxxxxxx ، 9665xxxxxxxx ، +9665xxxxxxxx
   */
  public static normalizePhone(phone: string, defaultCountryCode = '966'): string {
    let digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = defaultCountryCode + digits.slice(1);
    if (digits.length === 9 && digits.startsWith('5')) digits = defaultCountryCode + digits;
    return digits;
  }

  public static buildQuoteMessage(p: WhatsAppQuoteParams): string {
    const fmt = QuotationEngine.formatSAR;
    const lines = [
      `السلام عليكم ورحمة الله وبركاته، الأستاذ الكريم *${p.clientName}*.`,
      `يسرنا إرسال تفاصيل عرض السعر رقم: *${p.quotationNumber}*`,
      '',
      '*تفاصيل النظام المعماري:*',
      `• النظام: ${p.systemName}`,
      `• الزجاج: ${p.glassLabel}`,
      `• الأبعاد: ${p.dimensions.width} × ${p.dimensions.height} مم (العدد: ${p.dimensions.qty})`,
      '',
      '*الخلاصة المالية:*',
      `• المجموع قبل الضريبة: ${fmt(p.bill.subtotalWithMargin)}`,
      `• ضريبة القيمة المضافة (15%): ${fmt(p.bill.vatAmount)}`,
      `• *الإجمالي النهائي: ${fmt(p.bill.grandTotal)}*`,
    ];

    if (p.approvalUrl) {
      lines.push('', `للاعتماد الإلكتروني المباشر: ${p.approvalUrl}`);
    }
    if (p.companyName) {
      lines.push('', p.companyName);
    }
    return lines.join('\n');
  }

  public static generateQuoteLink(p: WhatsAppQuoteParams): string {
    const phone = this.normalizePhone(p.clientPhone);
    const text = encodeURIComponent(this.buildQuoteMessage(p));
    return `https://wa.me/${phone}?text=${text}`;
  }
}
