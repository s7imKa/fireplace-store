import { useEffect, useState, type ReactNode } from 'react'
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
    const STORAGE_KEY = 'cart-items'

    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return []
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) return []
            // Мінімальна валідація записів
            return parsed
                .filter(
                    (i: any) =>
                        i &&
                        typeof i.productId === 'string' &&
                        typeof i.price === 'number' &&
                        i.qty,
                )
                .map((i: any) => ({
                    productId: i.productId,
                    name: i.name || '',
                    price: Number(i.price) || 0,
                    qty: Math.max(1, Math.floor(Number(i.qty) || 1)),
                    ...(i.imageUrl ? { imageUrl: i.imageUrl } : {}),
                }))
        } catch (e) {
            console.warn('Cart localStorage parse error:', e)
            return []
        }
    })

    // Зберігаємо у localStorage при зміні
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        } catch (e) {
            console.warn('Cart localStorage save error:', e)
        }
    }, [items])

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
