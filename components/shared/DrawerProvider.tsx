'use client'

import { TaskDrawer } from '@/components/shared/TaskDrawer'
import { CreateTaskModal } from '@/components/shared/CreateTaskModal'

type DrawerProviderProps = {
  children: React.ReactNode
}

export function DrawerProvider({ children }: DrawerProviderProps) {
  return (
    <>
      {children}
      <TaskDrawer />
      <CreateTaskModal />
    </>
  )
}
