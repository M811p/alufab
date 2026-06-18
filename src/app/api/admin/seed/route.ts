import { NextRequest, NextResponse } from 'next/server';
import { hashSync } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// مسار مؤقت لمرة واحدة لزرع حساب المدير الافتراضي في قاعدة بيانات الإنتاج
// يُحذف بعد الاستخدام — محمي بمفتاح سري عبر متغير بيئة SEED_SECRET
const defaultHardwareRules = {
  hinges: { baseCount: 2, perHeightLimit: 700 },
  rollers: { perPanelCount: 2 },
  locks: { perSashCount: 1 },
  siliconeAndGaskets: { wasteMultiplier: 1.05 },
};

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'مصنع الوسام الأبيض للألمنيوم والزجاج',
      crNumber: '1010XXXXXX',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@demo.sa' },
    update: {},
    create: {
      email: 'admin@demo.sa',
      password: hashSync('Demo12345678', 12),
      name: 'مدير النظام التجريبي',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  const profiles = [
    {
      systemName: 'ALUPCO SG — سحاب',
      systemType: 'SLIDING' as const,
      frameToSashHorizontal: 42,
      frameToSashVertical: 50,
      mullionDeduction: 90,
      transomDeduction: 90,
      overlapAllowance: 30,
      glassDeductionHorizontal: 110,
      glassDeductionVertical: 110,
    },
    {
      systemName: 'Technal — مفصلي',
      systemType: 'HINGED' as const,
      frameToSashHorizontal: 24,
      frameToSashVertical: 24,
      mullionDeduction: 80,
      transomDeduction: 80,
      overlapAllowance: 0,
      glassDeductionHorizontal: 95,
      glassDeductionVertical: 95,
    },
  ];

  for (const p of profiles) {
    await prisma.deductionProfile.upsert({
      where: { tenantId_systemName: { tenantId: tenant.id, systemName: p.systemName } },
      update: {},
      create: { ...p, tenantId: tenant.id, hardwareFormulaRules: defaultHardwareRules },
    });
  }

  return NextResponse.json({
    message: 'تم إنشاء حساب المدير بنجاح',
    email: 'admin@demo.sa',
    password: 'Demo12345678',
  });
}
