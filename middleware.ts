import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rotas que precisam de autenticação
  const protectedRoutes = ['/home', '/onboarding'];
  
  // Rotas de autenticação (não devem ser acessadas se já estiver logado)
  const authRoutes = ['/login', '/signup'];

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Se não tem sessão e está tentando acessar rota protegida
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se tem sessão e está tentando acessar rota de auth
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Após autenticação, buscar perfil do usuário e checar onboarding_completed
  if (session && isProtectedRoute) {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();
    const onboardingDone = !!profile && profile.onboarding_completed === true;
    if (!onboardingDone && req.nextUrl.pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
    if (onboardingDone && req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/home/:path*', '/onboarding/:path*', '/login', '/signup'],
}; 