import type { User } from 'firebase/auth'
import { createContext } from 'react'
import type { CartItem } from '../types/order.type'
import type { dataFirebaseState } from './ProductContextFireBase'

export const DataContext = createContext<dataFirebaseState>({
    products: [],
    category: [],
})

export interface AuthState {
    user: User | null
    loading: boolean
    // ДОДАНО: роль
    isAdmin?: boolean
}

export const AuthContext = createContext<AuthState>({ user: null, loading: true })

interface CartContextValue {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (productId: string) => void
    clear: () => void
    total: number
}

export const CartContext = createContext<CartContextValue>({
    items: [],
    addItem: () => {},
    removeItem: () => {},
    clear: () => {},
    total: 0,
})
