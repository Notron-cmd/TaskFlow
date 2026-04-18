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
      <div className="flex h-screen bg-white dark:bg-[#0F0F1A] overflow-hidden">
        {/* Sidebar - hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <Sidebar user={userData} />
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden w-full md:w-auto">
          <Topbar user={userData} />
          <main className="flex-1 overflow-auto p-4 md:p-6 pt-20 md:pt-20 md:ml-56 bg-white dark:bg-[#0F0F1A]">
            {children}
          </main>
        </div>
      </div>
    </DrawerProvider>
  )
}
