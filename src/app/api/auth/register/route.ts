import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

/**
 * تسجيل مصنع جديد (Tenant) مع أول مستخدم بصلاحية ADMIN.
 * المستخدمون اللاحقون يضيفهم الـ ADMIN من شاشة إدارة الفريق.
 */
const RegisterSchema = z.object({
  factoryName: z.string().min(3, 'اسم المصنع 3 أحرف على الأقل'),
  crNumber: z.string().regex(/^\d{10}$/, 'السجل التجاري السعودي 10 أرقام').optional(),
  adminName: z.string().min(2),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z
    .string()
    .min(10, 'كلمة المرور 10 خانات على الأقل')
    .regex(/[A-Za-z]/, 'يجب أن تحتوي على حرف')
    .regex(/\d/, 'يجب أن تحتوي على رقم'),
});

export async function POST(req: NextRequest) {
  try {
    const body = RegisterSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجّل مسبقاً' }, { status: 409 });
    }

    const passwordHash = await hash(body.password, 12);

    const tenant = await prisma.tenant.create({
      data: {
        name: body.factoryName,
        crNumber: body.crNumber,
        users: {
          create: {
            email,
            password: passwordHash,
            name: body.adminName,
            role: 'ADMIN',
          },
        },
      },
      select: { id: true, name: true },
    });

    return NextResponse.json(
      { tenant, message: 'تم إنشاء حساب المصنع — يمكنك تسجيل الدخول الآن' },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
