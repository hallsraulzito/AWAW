import { useState } from "react"
import { getToken, limparSessao } from "@/lib/api"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: "ARTIST" | "COMPANY" | "SOCIAL" | "ADMIN" | "CLIENT"
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem("awaw_user")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const isAuthenticated = !!user

  const login = (userData: UserProfile) => {
    localStorage.setItem("awaw_user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    limparSessao()
    setUser(null)
  }

  return {
    user,
    token: getToken(),
    isAuthenticated,
    isAdmin: user?.role === "ADMIN",
    login,
    logout,
  }
}
