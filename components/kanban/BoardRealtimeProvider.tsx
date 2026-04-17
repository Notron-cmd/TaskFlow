'use client'

import { useRealtimeBoard } from '@/hooks/useRealtimeBoard'

type BoardRealtimeProviderProps = {
  workspaceId: string
  children: React.ReactNode
}

export function BoardRealtimeProvider({
  workspaceId,
  children,
}: BoardRealtimeProviderProps) {
  useRealtimeBoard(workspaceId)
  return <>{children}</>
}
