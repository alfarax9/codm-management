import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Satu-satunya halaman yang boleh dibuka tanpa sesi. Semua route lain — termasuk
 * yang belum dibuat — otomatis tertutup, karena daftarnya berupa izin, bukan
 * larangan. Menambah fitur baru tidak akan sengaja membukanya untuk publik.
 */
const PUBLIC_PATHS = ['/login', '/daftar', '/lupa-kata-sandi', '/auth', '/invite']

/**
 * Menyegarkan token Supabase di tiap request dan menjaga halaman aplikasi
 * tetap butuh login. Cookie yang diperbarui harus ditulis ke request DAN response —
 * Server Component membaca dari request, browser membaca dari response.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)'],
}
