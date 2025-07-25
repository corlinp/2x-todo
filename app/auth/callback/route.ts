import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/protected'

  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/protected'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // In production, use the correct site URL instead of falling back to origin
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://2x.ai'
        return NextResponse.redirect(`${siteUrl}${next}`)
      }
    } else {
      // redirect the user to an error page with some instructions
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (isLocalEnv ? origin : 'https://2x.ai')
      return NextResponse.redirect(`${siteUrl}/auth/error?error=${error.message}`)
    }
  }

  // redirect the user to an error page with some instructions
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (isLocalEnv ? origin : 'https://2x.ai')
  return NextResponse.redirect(`${siteUrl}/auth/error?error=No code provided`)
} 