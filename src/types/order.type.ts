import type { Timestamp } from 'firebase/firestore'

export interface CartItem {
    productId: string
    name: string
    price: number
    qty: number
    imageUrl?: string
}

export type OrderStatus = 'new' | 'waiting-shipping' | 'paid' | 'shipped' | 'cancelled'

export interface ShippingInfo {
    firstName: string
    lastName: string
    phone: string
    city: string
    novaPoshtaBranch: string
    comment?: string
}

export interface Order {
    id?: string
    userId: string
    items: CartItem[]
    total: number
    status: OrderStatus
    createdAt: Timestamp | number // якщо вже є old дані
    shipping?: ShippingInfo
}
