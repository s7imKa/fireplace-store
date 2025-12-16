import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ShippingForm from '../../components/features/ShippingForm'
import { CartContext } from '../../contexts/cart.context'
import { AuthContext } from '../../contexts/context'
import { createOrder } from '../../hooks/useOrders'

export default function Cart() {
    const { items, removeItem, clear, total, updateQty } = useContext(CartContext)
    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    const [showShipping, setShowShipping] = useState(false)
    const [lastOrderId, setLastOrderId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [placing, setPlacing] = useState(false)

    const checkout = async () => {
        setError(null)
        if (!user) {
            navigate('/login', { state: { redirectTo: '/cart' } })
            return
        }
        if (items.length === 0) {
            setError('Кошик порожній')
            return
        }
        setPlacing(true)
        try {
            const id = await createOrder({
                userId: user.uid,
                items,
                total,
                status: 'new',
            })
            clear()
            setLastOrderId(id)
            setShowShipping(true)
        } catch (e: unknown) {
            console.error('createOrder error:', e)
            setError(e instanceof Error ? e.message : 'Не вдалося створити замовлення')
        } finally {
            setPlacing(false)
        }
    }

    return (
        <div style={{ maxWidth: 900, margin: '20px auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Кошик</h2>
                <Link to='/'>← До головної</Link>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {items.length === 0 ? (
                <div style={{ marginTop: 16 }}>
                    <p>Кошик порожній.</p>
                    <Link to='/'>Перейти до товарів</Link>
                </div>
            ) : (
                <>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
                        {items.map(i => (
                            <li
                                key={i.productId}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.4fr 0.8fr 0.6fr auto',
                                    gap: 12,
                                    alignItems: 'center',
                                    borderBottom: '1px solid #eee',
                                    padding: '10px 0',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{i.name}</div>
                                    <div style={{ fontSize: 13, color: '#666' }}>
                                        Ціна: {i.price} ₴
                                    </div>
                                </div>

                                {/* Кількість */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button onClick={() => updateQty(i.productId, i.qty - 1)}>
                                        -
                                    </button>
                                    <input
                                        type='number'
                                        min={1}
                                        value={i.qty}
                                        onChange={e =>
                                            updateQty(i.productId, Number(e.target.value))
                                        }
                                        style={{ width: 60, textAlign: 'center' }}
                                    />
                                    <button onClick={() => updateQty(i.productId, i.qty + 1)}>
                                        +
                                    </button>
                                </div>

                                {/* Сума рядка */}
                                <div style={{ fontWeight: 600 }}>{i.price * i.qty} ₴</div>

                                <button onClick={() => removeItem(i.productId)}>Видалити</button>
                            </li>
                        ))}
                    </ul>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 16,
                            borderTop: '1px solid #eee',
                            paddingTop: 12,
                        }}
                    >
                        <button onClick={clear}>Очистити кошик</button>
                        <div>
                            <b>Загальна сума: {total} ₴</b>
                        </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <button
                            onClick={checkout}
                            style={{ padding: '8px 16px' }}
                            disabled={placing}
                        >
                            {placing ? 'Створення замовлення...' : 'Оформити замовлення'}
                        </button>
                    </div>
                </>
            )}

            {/* Модальне вікно доставки після створення замовлення */}
            {showShipping && lastOrderId && (
                <ShippingForm
                    orderId={lastOrderId}
                    onDone={() => {
                        setShowShipping(false)
                        setLastOrderId(null)
                    }}
                />
            )}
        </div>
    )
}
