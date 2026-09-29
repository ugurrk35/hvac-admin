'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'


interface AuthContextType {
	isAuthenticated: boolean
	user: User | null
	login: (user?: User) => void
	logout: () => void
	loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	// Sayfa yüklendiğinde token'ı kontrol et
	useEffect(() => {
		const initAuth = async () => {
			try {
				const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
				if (response.ok) {
					const session = await response.json() as { user?: User }
					setUser(session.user ?? null)
					setIsAuthenticated(true)
				} else {
					setIsAuthenticated(false)
				}
			} catch {
				setIsAuthenticated(false)
			} finally {
				setLoading(false)
			}
		}

		// Browser ortamında çalışır
		if (typeof window !== 'undefined') {
			initAuth()
		} else {
			setLoading(false)
		}
	}, [])

	const login = (newUser?: User) => {
		try {
			if (newUser) {
				setUser(newUser)
			}
			setIsAuthenticated(true)
		} catch {
		}
	}

	const logout = () => {
		try {
			void fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" })
			setUser(null)
			setIsAuthenticated(false)
			
		} catch {
		}
	}

	return (
		<AuthContext.Provider 
			value={{
				isAuthenticated,
				user,
				login,
				logout,
				loading
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
export const useIsAuthenticated = () => {
	const { isAuthenticated, loading } = useAuth()
	return { isAuthenticated, loading }
}
