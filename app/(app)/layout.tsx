import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { DrawerProvider } from '@/components/shared/DrawerProvider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userData = {
    id: user.id,
    email: user.email ?? '',
    user_metadata: {
      full_name: user.user_metadata?.full_name as string | undefined,
      avatar_url: user.user_metadata?.avatar_url as string | undefined,
    },
  }

  return (
    <DrawerProvider>
      <div className="flex h-screen bg-[#0F0F1A] overflow-hidden">
        <Sidebar user={userData} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar user={userData} />
          <main className="flex-1 overflow-auto p-6 mt-14 ml-56">
            {children}
          </main>
        </div>
      </div>
    </DrawerProvider>
  )
}
