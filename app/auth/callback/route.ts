import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  if (!code) {
    const loginUrl = new URL('/login', siteUrl)
    loginUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.redirect(new URL('/login', siteUrl))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Session exchange error:', error)
    const loginUrl = new URL('/login', siteUrl)
    loginUrl.searchParams.set('error', 'session_failed')
    return NextResponse.redirect(loginUrl)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', siteUrl)
    loginUrl.searchParams.set('error', 'no_user')
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  const destination = profile?.onboarding_complete ? '/dashboard' : '/onboarding'
  response.headers.set('Location', new URL(destination, siteUrl).toString())

  return response
}