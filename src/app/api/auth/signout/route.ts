import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://brickquote.app'
  const response = NextResponse.redirect(new URL('/login', origin), 302)

  // Delete all Supabase auth cookies directly on the redirect response
  const cookieStore = await cookies()
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
      })
    }
  }

  return response
}
