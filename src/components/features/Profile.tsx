import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore'
import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/auth.context'
import { auth, db } from '../../firebase'
import { logout } from '../../hooks/useAuthActions'
import type { Order } from '../../types/order.type'
import './Profile.scss'

type TimestampLike =
    | number
    | Timestamp
    | { seconds: number; toMillis: () => number }
    | null
    | undefined

function toMillis(v: TimestampLike) {
    if (!v) return 0
    if (typeof v === 'number') return v
    if (typeof v.toMillis === 'function') return v.toMillis()
    if (v.seconds) return v.seconds * 1000
    return 0
}

function formatDate(v: TimestampLike) {
    const ms = toMillis(v)
    if (!ms) return '—'
    return new Date(ms).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    new: { label: 'Нове', color: '#3498db' },
    'waiting-shipping': { label: 'Очікує доставки', color: '#f39c12' },
    paid: { label: 'Оплачено', color: '#2ecc71' },
    shipped: { label: 'Відправлено', color: '#9b59b6' },
    cancelled: { label: 'Скасовано', color: '#e74c3c' },
}

interface ExpandedOrder {
    [orderId: string]: boolean
}

export default function Profile() {
    const { user, loading: authLoading } = useContext(AuthContext)
    const navigate = useNavigate()

    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<ExpandedOrder>({})
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const storageKey = user ? `orders-cache-${user.uid}` : null

    // Редірект якщо не авторизований
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { replace: true })
        }
    }, [user, authLoading, navigate])

    // Завантаження замовлень
    useEffect(() => {
        // Попередньо показуємо кеш, якщо є
        if (storageKey) {
            try {
                const cached = localStorage.getItem(storageKey)
                if (cached) {
                    const parsed = JSON.parse(cached)
                    if (Array.isArray(parsed)) {
                        setOrders(parsed)
                    }
                }
            } catch (e) {
                console.warn('Orders cache read error:', e)
            }
        }

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const currentUser = auth.currentUser
                if (!currentUser) {
                    setOrders([])
                    setLoading(false)
                    return
                }
                const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid))
                const snap = await getDocs(q)
                const list: Order[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Order) }))
                list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
                setOrders(list)
                if (storageKey) {
                    localStorage.setItem(storageKey, JSON.stringify(list))
                }
            } catch (e: any) {
                console.error('Load orders error:', e)
                setError(e?.message || 'Помилка завантаження замовлень')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [storageKey])

    const toggleExpanded = (orderId: string) => {
        setExpanded(prev => ({
            ...prev,
            [orderId]: !prev[orderId],
        }))
    }

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login', { replace: true })
        } catch (e) {
            console.error('Logout error:', e)
        }
    }

    if (authLoading || loading) {
        return (
            <div className='profile-container'>
                <div className='loading-spinner'>
                    <p>Завантаження...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    const statusInfo = (status: string) =>
        STATUS_LABELS[status] || { label: status, color: '#95a5a6' }

    return (
        <div className='container '>
            <div className='profile-container '>
                {/* Основна інформація користувача */}
                <Link to='/' className='cart-page__back-link linkhome'>
                    ← До головної
                </Link>
                <div className='user-info-card'>
                    <div className='card-header'>
                        <h3>👤 Мій профіль</h3>
                    </div>
                    <div className='card-content'>
                        <div className='info-row'>
                            <div>
                                {' '}
                                <label style={{ marginRight: '20px' }}>Email:</label>
                                <span className='info-value'>{user.email}</span>
                            </div>
                            <button
                                className='btn-logout'
                                onClick={() => setShowLogoutConfirm(true)}
                            >
                                Вийти
                            </button>
                        </div>
                    </div>
                </div>

                {/* Помилка */}
                {error && <div className='error-message'>⚠️ {error}</div>}

                {/* Замовлення */}
                <div className='orders-card'>
                    <div className='card-header'>
                        <h2>📦 Мої замовлення</h2>
                        <span className='orders-count'>{orders.length}</span>
                    </div>

                    {orders.length === 0 ? (
                        <div className='empty-state'>
                            <div className='empty-icon'>📭</div>
                            <p>У вас ще немає замовлень</p>
                            <a href='/' className='btn-shop'>
                                Перейти до магазину
                            </a>
                        </div>
                    ) : (
                        <div className='orders-list'>
                            {orders.map(order => {
                                const isExpanded = expanded[order.id!]
                                const status = statusInfo(order.status)

                                return (
                                    <div key={order.id} className='order-item'>
                                        <div
                                            className='order-header'
                                            onClick={() => toggleExpanded(order.id!)}
                                        >
                                            <div className='order-summary'>
                                                <div className='order-number'>
                                                    Замовлення #{order.id?.slice(0, 8)}
                                                </div>
                                                <div className='order-meta'>
                                                    <span className='order-date'>
                                                        📅 {formatDate(order.createdAt)}
                                                    </span>
                                                    <span
                                                        className='order-status'
                                                        style={{ backgroundColor: status.color }}
                                                    >
                                                        {status.label}
                                                    </span>
                                                    <span className='order-total'>
                                                        Сума: <strong>{order.total} ₴</strong>
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className={`expand-icon ${
                                                    isExpanded ? 'open' : ''
                                                }`}
                                            >
                                                ▼
                                            </div>
                                        </div>

                                        {/* Деталі замовлення */}
                                        {isExpanded && (
                                            <div className='order-details'>
                                                <div className='details-section'>
                                                    <h4>Товари в замовленні:</h4>
                                                    <ul className='items-list'>
                                                        {order.items.map((item, idx) => (
                                                            <li key={idx} className='item-line'>
                                                                <span className='item-name'>
                                                                    {item.name}
                                                                </span>
                                                                <span className='item-qty'>
                                                                    x{item.qty}
                                                                </span>
                                                                <span className='item-price'>
                                                                    {item.price * item.qty} ₴
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Інформація про доставку */}
                                                {order.shipping ? (
                                                    <div className='details-section'>
                                                        <h4>Адреса доставки:</h4>
                                                        <div className='shipping-info'>
                                                            <p>
                                                                <strong>Отримувач:</strong>{' '}
                                                                {order.shipping.lastName}{' '}
                                                                {order.shipping.firstName}
                                                            </p>
                                                            <p>
                                                                <strong>Телефон:</strong>{' '}
                                                                {order.shipping.phone}
                                                            </p>
                                                            <p>
                                                                <strong>Місто:</strong>{' '}
                                                                {order.shipping.city}
                                                            </p>
                                                            <p>
                                                                <strong>Відділення:</strong>{' '}
                                                                {order.shipping.novaPoshtaBranch}
                                                            </p>
                                                            {order.shipping.comment && (
                                                                <p>
                                                                    <strong>Коментар:</strong>{' '}
                                                                    {order.shipping.comment}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className='details-section'>
                                                        <p className='no-shipping'>
                                                            ℹ️ Інформація про доставку ще не вказана
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Модальне вікно підтвердження виходу */}
                {showLogoutConfirm && (
                    <div className='modal-overlay' onClick={() => setShowLogoutConfirm(false)}>
                        <div
                            className='modal-content'
                            onClick={e => {
                                e.stopPropagation()
                            }}
                        >
                            <h3>Вихід з акаунту</h3>
                            <p>Ви впевнені, що хочете вийти?</p>
                            <div className='modal-actions'>
                                <button
                                    className='btn-cancel'
                                    onClick={() => setShowLogoutConfirm(false)}
                                >
                                    Скасувати
                                </button>
                                <button className='btn-confirm' onClick={handleLogout}>
                                    Вийти
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
