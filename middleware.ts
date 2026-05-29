import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Inicializa o cliente Supabase para o middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // 2. Obtém a sessão do usuário ativo
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 3. Rota de proteção de Dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Se não estiver autenticado, manda para o login
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Busca o perfil do usuário no banco de dados para checar a "role" (cargo)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Se o perfil não existir ou não tiver role, força a escolher o perfil
    if (!profile || !profile.role) {
      url.pathname = '/escolha-perfil'
      return NextResponse.redirect(url)
    }

    const role = profile.role
    const isTherapistRoute = request.nextUrl.pathname.startsWith('/dashboard/fisioterapeuta')
    const isPatientRoute = request.nextUrl.pathname.startsWith('/dashboard/paciente')
    const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard/admin')

    // Regra: Se for Admin, impede de entrar em rotas de Terapeuta ou Paciente
    if (role === 'admin') {
      if (isTherapistRoute || isPatientRoute) {
        url.pathname = '/dashboard/admin'
        return NextResponse.redirect(url)
      }
    }

    // Regra: Se NÃO for Admin, impede de entrar em rota de Admin
    if (role !== 'admin' && isAdminRoute) {
      if (role === 'therapist') {
        url.pathname = '/dashboard/fisioterapeuta'
      } else {
        url.pathname = '/dashboard/paciente'
      }
      return NextResponse.redirect(url)
    }

    // Regra: Paciente NUNCA acessa Área da Fisioterapeuta
    if (role === 'patient' && isTherapistRoute) {
      console.warn(`[MIDDLEWARE] Acesso bloqueado: Paciente ${user.email} tentou acessar rota de Fisioterapeuta. Redirecionando...`)
      url.pathname = '/dashboard/paciente'
      return NextResponse.redirect(url)
    }

    // Regra: Fisioterapeuta NUNCA acessa Área do Paciente
    if (role === 'therapist' && isPatientRoute) {
      console.warn(`[MIDDLEWARE] Acesso bloqueado: Fisioterapeuta ${user.email} tentou acessar rota de Paciente. Redirecionando...`)
      url.pathname = '/dashboard/fisioterapeuta'
      return NextResponse.redirect(url)
    }
  }

  // Protege a página de escolha de perfil se o usuário não estiver logado
  if (request.nextUrl.pathname === '/escolha-perfil' && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se o usuário logado com cargo tentar ir para login/register, manda direto para seu respectivo dashboard
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile && profile.role) {
      if (profile.role === 'admin') {
        url.pathname = '/dashboard/admin'
      } else if (profile.role === 'therapist') {
        url.pathname = '/dashboard/fisioterapeuta'
      } else {
        url.pathname = '/dashboard/paciente'
      }
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Captura todas as rotas de requisição, exceto as seguintes:
     * - api (rotas de API do Next)
     * - _next (arquivos e HMR do Next.js)
     * - favicon.ico, sitemap.xml, robots.txt (arquivos do navegador)
     */
    '/((?!api|_next|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
