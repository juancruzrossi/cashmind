import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === '/login';
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth');
  const isPublicAsset = req.nextUrl.pathname.startsWith('/_next') ||
                        req.nextUrl.pathname.startsWith('/favicon');

  if (isApiAuth || isPublicAsset) {
    return;
  }

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    const dashboardUrl = new URL('/dashboard', req.nextUrl.origin);
    return Response.redirect(dashboardUrl);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
