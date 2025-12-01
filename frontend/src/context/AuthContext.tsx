/**
 * Authentication Context - Using Generated OpenAPI Client
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { UserResponse } from '@/client'
import { authService, LoginData, RegisterData } from '@/services/auth.service'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants/config'

interface AuthContextType {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: UserResponse) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Run only once on mount to prevent infinite loop
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is already logged in
        const token = localStorage.getItem('token')
        const savedUser = storage.get<UserResponse>(STORAGE_KEYS.USER)

        if (token && savedUser) {
          setUser(savedUser)
        }
      } catch (error) {
        // On error (e.g., 401), just clear state - do NOT trigger redirect or reload
        console.error('Auth initialization error:', error)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        storage.remove(STORAGE_KEYS.USER)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (data: LoginData) => {
    // ✅ authService.login now saves token to 'token' key automatically
    const tokens = await authService.login(data)

    // Note: token is already saved by authService.login to 'token' key
    // We only need to save refresh_token and get user info

    // Get user info using generated client
    const userResponse = await authService.getCurrentUser()
    storage.set(STORAGE_KEYS.USER, userResponse)
    setUser(userResponse)
  }

  const register = async (data: RegisterData) => {
    await authService.register(data)
    // Auto login after register
    await login({ email: data.email, password: data.password })
  }

  const logout = () => {
    // ✅ Use 'token' key (matches apiClient.ts)
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    storage.remove(STORAGE_KEYS.USER)
    setUser(null)

    // Call logout endpoint
    authService.logout().catch(err => {
      console.error('Logout API call failed:', err)
    })
  }

  const updateUser = (updatedUser: UserResponse) => {
    setUser(updatedUser)
    storage.set(STORAGE_KEYS.USER, updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
