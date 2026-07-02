import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  if (code) {
    // Default response — cookies set honge isi pe, final redirect baad me banayenge
    let response = NextResponse.redirect(`${siteUrl}/login`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get('cookie') || ''
            return cookieHeader
              .split(';')
              .filter(Boolean)
              .map((c) => {
                const [name, ...rest] = c.trim().split('=')
                return { name, value: rest.join('=') }
              })
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

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single()

        const destination = profile?.onboarding_complete
          ? '/dashboard'
          : '/onboarding'

        // Naya redirect response banao, lekin jo cookies upar set hue the wo copy karo
        const finalResponse = NextResponse.redirect(`${siteUrl}${destination}`)
        response.cookies.getAll().forEach((cookie) => {
          finalResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
        return finalResponse
      }
    }

    // exchange fail hua ya user nahi mila — cookies wale response ke sath login pe bhejo
    return response
  }

  return NextResponse.redirect(`${siteUrl}/login`)
}