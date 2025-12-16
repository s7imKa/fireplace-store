import { useState, type ReactNode } from 'react'
import type { CartItem } from '../types/order.type'
import { CartContext } from './context'

interface CartContextValue {
    items: CartItem[]
    total: number
    addItem: (item: CartItem) => void
    removeItem: (productId: string) => void
    clear: () => void
    updateQty: (productId: string, qty: number) => void // ДОДАНО
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])

    const addItem = (item: CartItem) => {
        setItems(prev => {
            const exists = prev.find(i => i.productId === item.productId)
            if (exists) {
                return prev.map(i =>
                    i.productId === item.productId ? { ...i, qty: i.qty + item.qty } : i,
                )
            }
            return [...prev, item]
        })
    }

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId))
    }

    const clear = () => setItems([])

    const updateQty = (productId: string, qty: number) => {
        setItems(prev =>
            prev
                .map(i =>
                    i.productId === productId ? { ...i, qty: Math.max(1, Math.floor(qty)) } : i,
                )
                .filter(i => i.qty > 0),
        )
    }

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)

    return (
        <CartContext.Provider value={{ items, total, addItem, removeItem, clear, updateQty }}>
            {children}
        </CartContext.Provider>
    )
}
export { CartContext }
