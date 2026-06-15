import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

const defaultHardwareRules = {
  hinges: { baseCount: 2, perHeightLimit: 700 },
  rollers: { perPanelCount: 2 },
  locks: { perSashCount: 1 },
  siliconeAndGaskets: { wasteMultiplier: 1.05 },
};

async function main() {
  // ===== المستأجر التجريبي (المصنع) =====
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'مصنع الوسام الأبيض للألمنيوم والزجاج',
      crNumber: '1010XXXXXX',
    },
  });

  // ===== مستخدم تجريبي للدخول الفوري بعد الإعداد =====
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

  // ===== مصفوفة الخصميات الافتراضية للأنظمة السعودية والخليجية =====
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
      systemName: 'Saraya 10cm — سحاب',
      systemType: 'SLIDING' as const,
      frameToSashHorizontal: 45,
      frameToSashVertical: 52,
      mullionDeduction: 95,
      transomDeduction: 95,
      overlapAllowance: 32,
      glassDeductionHorizontal: 112,
      glassDeductionVertical: 112,
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
    {
      systemName: 'Schuco AWS — مفصلي',
      systemType: 'HINGED' as const,
      frameToSashHorizontal: 22,
      frameToSashVertical: 22,
      mullionDeduction: 78,
      transomDeduction: 78,
      overlapAllowance: 0,
      glassDeductionHorizontal: 92,
      glassDeductionVertical: 92,
    },
    {
      systemName: 'Reynaers CW 50 — واجهات',
      systemType: 'CURTAIN_WALL' as const,
      frameToSashHorizontal: 0,
      frameToSashVertical: 0,
      mullionDeduction: 50,
      transomDeduction: 50,
      overlapAllowance: 0,
      glassDeductionHorizontal: 12,
      glassDeductionVertical: 12,
    },
  ];

  for (const p of profiles) {
    await prisma.deductionProfile.upsert({
      where: { tenantId_systemName: { tenantId: tenant.id, systemName: p.systemName } },
      update: {},
      create: { ...p, tenantId: tenant.id, hardwareFormulaRules: defaultHardwareRules },
    });
  }

  // ===== أصناف مخزون أولية =====
  const inventory = [
    { sku: 'ALU-ALUPCO-SG-5.8M', name: 'قطاع ألمنيوم خام — ALUPCO SG — سحاب', category: 'PROFILE', stockLevel: 120, minRequired: 30, unitCost: 185, stockBarLength: 5800, imageUrl: null },
    { sku: 'ALU-SARAYA-10CM-5.8M', name: 'قطاع ألمنيوم خام — سرايا 10 سم — سحاب', category: 'PROFILE', stockLevel: 80, minRequired: 20, unitCost: 195, stockBarLength: 5800, imageUrl: null },
    { sku: 'GLS-DGU-24', name: 'زجاج مزدوج (دبل) 24 مم', category: 'GLASS', stockLevel: 250, minRequired: 50, unitCost: 145, stockBarLength: 5800, imageUrl: null },
    { sku: 'GLS-TMP-6', name: 'زجاج مقسّى (سيكوريت) 6 مم', category: 'GLASS', stockLevel: 400, minRequired: 80, unitCost: 75, stockBarLength: 5800, imageUrl: null },
    { sku: 'GLS-LOWE-DGU-24', name: 'زجاج مزدوج عاكس Low-E 24 مم', category: 'GLASS', stockLevel: 120, minRequired: 25, unitCost: 210, stockBarLength: 5800, imageUrl: null },
    { sku: 'HW-ROLLER-STD', name: 'بكرات سحاب', category: 'HARDWARE', stockLevel: 500, minRequired: 100, unitCost: 12, stockBarLength: 5800, imageUrl: null },
    { sku: 'HW-LOCK-ONU', name: 'أقفال', category: 'HARDWARE', stockLevel: 300, minRequired: 60, unitCost: 35, stockBarLength: 5800, imageUrl: null },
    { sku: 'HW-HINGE-3INCH', name: 'مفصلات 3 بوصة', category: 'HARDWARE', stockLevel: 400, minRequired: 80, unitCost: 18, stockBarLength: 5800, imageUrl: null },
    { sku: 'ACC-GASKET-MTR', name: 'كاوتشوك (Gasket)', category: 'ACCESSORY', stockLevel: 2000, minRequired: 400, unitCost: 2.5, stockBarLength: 5800, imageUrl: null },
    { sku: 'ACC-SPACER-MTR', name: 'سبيسر ألمنيوم (Spacer Bar) DGU', category: 'ACCESSORY', stockLevel: 1000, minRequired: 200, unitCost: 8, stockBarLength: 5800, imageUrl: null },
    { sku: 'ACC-CORNER-CLEAT', name: 'زوايا التجميع (Corner Cleat)', category: 'ACCESSORY', stockLevel: 2000, minRequired: 500, unitCost: 3, stockBarLength: 5800, imageUrl: null },
  ] as const;

  for (const item of inventory) {
    await prisma.inventoryItem.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: item.sku } },
      update: {},
      create: { ...item, tenantId: tenant.id },
    });
  }

  console.log('✅ تم زرع البيانات الأولية بنجاح:', tenant.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
