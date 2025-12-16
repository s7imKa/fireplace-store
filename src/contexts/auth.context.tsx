import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'
import { auth } from '../firebase'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    // ДОДАНО: isAdmin за email
    const isAdmin = !!user && user.email?.toLowerCase() === 'admin@gmail.com'

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u)
            setLoading(false)
        })
        return () => unsub()
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin } as any}>
            {children}
        </AuthContext.Provider>
    )
}
export { AuthContext }
