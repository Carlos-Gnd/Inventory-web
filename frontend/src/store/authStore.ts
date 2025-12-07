import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario } from '../types'
import { authService } from '../services/authService'

interface AuthState {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  
  // Actions
  login: (usuario: string, clave: string) => Promise<void>
  logout: () => void
  setUser: (user: Usuario) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: authService.getCurrentUser(),
      token: localStorage.getItem('token'),
      isAuthenticated: authService.isAuthenticated(),

      login: async (usuario: string, clave: string) => {
        try {
          const response = await authService.login({ usuario, clave })
          
          set({
            user: response.usuario,
            token: response.token,
            isAuthenticated: true
          })
        } catch (error) {
          throw error
        }
      },

      logout: () => {
        authService.logout()
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      setUser: (user: Usuario) => {
        set({ user })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)