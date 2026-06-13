import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, AuthError } from '@/lib/auth';
import { ProjectWorkflow, WorkflowError } from '@/services/project-workflow';
import type { ProjectStatus } from '@/types';

const TransitionSchema = z.object({
  targetStatus: z.enum(['DRAFT', 'QUOTED', 'APPROVED', 'PRODUCTION', 'INSTALLATION', 'COMPLETED']),
  allowNegativeStock: z.boolean().default(false),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireSession();
    const { id } = await params;
    const body = TransitionSchema.parse(await req.json());

    const result = await ProjectWorkflow.transition({
      projectId: id,
      tenantId: actor.tenantId,
      targetStatus: body.targetStatus,
      actorRole: actor.role,
      allowNegativeStock: body.allowNegativeStock,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    if (err instanceof WorkflowError) {
      return NextResponse.json(
        { error: err.message, code: err.code, details: err.details },
        { status: err.httpStatus }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: err.flatten() }, { status: 400 });
    }
    console.error('[PATCH /api/projects/:id/status]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireSession();
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: { id: true, status: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    }

    const current = project.status as ProjectStatus;
    const all: ProjectStatus[] = ['DRAFT', 'QUOTED', 'APPROVED', 'PRODUCTION', 'INSTALLATION', 'COMPLETED'];
    const availableTransitions = all.filter(
      (t) => ProjectWorkflow.canTransition(current, t) && ProjectWorkflow.roleAllowed(current, t, actor.role)
    );

    return NextResponse.json({ projectId: project.id, currentStatus: current, availableTransitions });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.httpStatus });
    }
    console.error('[GET /api/projects/:id/status]', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
