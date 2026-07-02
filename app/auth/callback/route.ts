import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  const response = NextResponse.redirect(`${siteUrl}/login`)

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
    return NextResponse.redirect(`${siteUrl}/login?error=session_failed`)
  }

  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login?error=no_user`)
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single()

  const destination = profile?.onboarding_complete ? '/dashboard' : '/onboarding'
  response.headers.set('Location', `${siteUrl}${destination}`)

  return response
}