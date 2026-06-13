import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const AcceptSchema = z.object({
  token: z.string().length(64, 'رمز دعوة غير صالح'),
  name: z.string().min(2, 'الاسم حرفان على الأقل'),
  password: z
    .string()
    .min(10, 'كلمة المرور 10 خانات على الأقل')
    .regex(/[A-Za-z]/, 'يجب أن تحتوي على حرف')
    .regex(/\d/, 'يجب أن تحتوي على رقم'),
});

/**
 * POST /api/auth/accept-invite — عام (بدون جلسة)
 * يتحقق من رمز الدعوة وينشئ حساب العضو بالدور المحدد مسبقاً من المدير.
 */
export async function POST(req: NextRequest) {
  try {
    const body = AcceptSchema.parse(await req.json());
    const tokenHash = createHash('sha256').update(body.token).digest('hex');

    const invitation = await prisma.invitation.findUnique({ where: { tokenHash } });
    // Respond with the same status (410) whether the token is unknown, already used, or expired
    // to prevent timing-based enumeration of valid invitation tokens.
    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'الدعوة غير صالحة أو منتهية الصلاحية أو مستخدمة مسبقاً — اطلب دعوة جديدة من مدير المصنع' }, { status: 410 });
    }

    const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد مسجّل بالفعل — سجّل الدخول مباشرة' }, { status: 409 });
    }

    const passwordHash = await hash(body.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invitation.email,
          name: body.name,
          password: passwordHash,
          role: invitation.role,
          tenantId: invitation.tenantId,
        },
        select: { id: true, email: true, name: true, role: true },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return created;
    });

    return NextResponse.json({ user, message: 'تم إنشاء حسابك — سجّل الدخول الآن' }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[POST /api/auth/accept-invite]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
