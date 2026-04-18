import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MobileMenuState {
  isOpen: boolean
  toggleMenu: () => void
  closeMenu: () => void
  openMenu: () => void
}

export const useMobileMenuStore = create<MobileMenuState>()(
  persist(
    (set) => ({
      isOpen: false,
      toggleMenu: () => set((state) => ({ isOpen: !state.isOpen })),
      closeMenu: () => set({ isOpen: false }),
      openMenu: () => set({ isOpen: true }),
    }),
    {
      name: 'mobile-menu-store',
    }
  )
)
