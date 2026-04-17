import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('[Auth Callback] Session exchange failed:', sessionError)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[Auth Callback] Failed to get user:', userError)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    console.log('[Auth Callback] User authenticated:', user.id, user.email)
    console.log('[Auth Callback] Workspace will be auto-created via database trigger')

    return NextResponse.redirect(`${origin}/board`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
