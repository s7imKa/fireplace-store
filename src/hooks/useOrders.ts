import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { CartItem, ShippingInfo } from '../types/order.type'

interface CreateOrderInput {
    userId: string
    items: CartItem[]
    total: number
    status: 'new' | 'waiting-shipping' | 'paid' | 'shipped' | 'cancelled'
}

export async function createOrder(order: CreateOrderInput) {
    if (!order.userId) throw new Error('userId is required')
    if (!order.items?.length) throw new Error('items is empty')

    const cleanItems = order.items.map(i =>
        Object.fromEntries(Object.entries(i).filter(([_, v]) => v !== undefined)),
    )

    const docRef = await addDoc(collection(db, 'orders'), {
        userId: order.userId,
        items: cleanItems,
        total: order.total,
        status: order.status,
        createdAt: serverTimestamp(),
    })
    return docRef.id
}

export async function notifyTelegram(orderId: string, order: any) {
    const token = import.meta.env.VITE_TG_TOKEN
    const chatId = import.meta.env.VITE_TG_CHAT
    if (!token || !chatId) return
    if (!order?.shipping) return

    const items =
        (order.items || [])
            .map((i: any) => `${i.name} x${i.qty} = ${i.price * i.qty}`)
            .join('\n') || '—'

    const s = order.shipping
    const text = `Нове замовлення
ID: ${orderId}
Статус: ${order.status}
Сума: ${order.total}

Товари:
${items}

Доставка:
${s.lastName} ${s.firstName}
Тел: ${s.phone}
Місто: ${s.city}
Відділення: ${s.novaPoshtaBranch}
${s.comment ? 'Коментар: ' + s.comment : ''}`

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
    })
}

export async function saveShippingInfo(orderId: string, info: ShippingInfo) {
    const ref = doc(db, 'orders', orderId)
    await updateDoc(ref, {
        shipping: info,
        status: 'waiting-shipping',
    })
    const snap = await getDoc(ref)
    await notifyTelegram(orderId, snap.data())
}

export async function notifyTelegramGuest(
    items: CartItem[],
    total: number,
    shipping: ShippingInfo,
) {
    const token = import.meta.env.VITE_TG_TOKEN
    const chatId = import.meta.env.VITE_TG_CHAT
    if (!token || !chatId) return

    const itemsText =
        items.map((i: CartItem) => `${i.name} x${i.qty} = ${i.price * i.qty} ₴`).join('\n') || '—'

    const text = `🆕 Нове замовлення (ГІСТЬ)
Статус: Нове
Сума: ${total} ₴

Товари:
${itemsText}

Доставка:
${shipping.lastName} ${shipping.firstName}
Тел: ${shipping.phone}
Місто: ${shipping.city}
Відділення: ${shipping.novaPoshtaBranch}
${shipping.comment ? 'Коментар: ' + shipping.comment : ''}`

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
    })
}
