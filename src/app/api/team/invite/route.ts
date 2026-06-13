import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole, AuthError } from '@/lib/auth';

const InviteSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  role: z.enum(['MANAGER', 'ESTIMATOR', 'DESIGNER', 'PRODUCTION']), // لا يُمنح ADMIN عبر دعوة
});

const INVITE_TTL_HOURS = 72;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * POST /api/team/invite — ADMIN فقط
 * ينشئ دعوة برمز عشوائي يُخزَّن مُجزّأ، ويُرجع رابط الانضمام مرة واحدة فقط
 * (يشاركه المدير عبر الواتساب أو البريد — لا حاجة لخادم بريد في النسخة الأولى).
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole('ADMIN');
    const body = InviteSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'هذا البريد مسجّل كمستخدم بالفعل' }, { status: 409 });
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    // إعادة الدعوة لنفس البريد تستبدل الدعوة السابقة (رمز جديد + مدة جديدة)
    const invitation = await prisma.invitation.upsert({
      where: { tenantId_email: { tenantId: actor.tenantId, email } },
      update: { role: body.role, tokenHash: hashToken(rawToken), expiresAt, acceptedAt: null, invitedById: actor.userId },
      create: {
        tenantId: actor.tenantId,
        email,
        role: body.role,
        tokenHash: hashToken(rawToken),
        invitedById: actor.userId,
        expiresAt,
      },
      select: { id: true, email: true, role: true, expiresAt: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/join?token=${rawToken}`;

    return NextResponse.json(
      {
        invitation,
        inviteUrl, // يُعرض مرة واحدة — الرمز الخام لا يُخزَّن
        message: `شارك الرابط مع ${email} — صالح لمدة ${INVITE_TTL_HOURS} ساعة`,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[POST /api/team/invite]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
