import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/join', '/api/auth'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic || pathname === '/') return NextResponse.next();

  if (!req.auth?.user) {
    // مسارات الـ API تُرجع 401 — الصفحات تُحوَّل لشاشة الدخول مع حفظ الوجهة
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'يتطلب تسجيل الدخول' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // استثناء الملفات الثابتة وأصول Next الداخلية
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|woff2?)$).*)'],
};
