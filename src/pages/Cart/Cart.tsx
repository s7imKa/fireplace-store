import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ShippingForm from '../../components/features/ShippingForm'
import { CartContext } from '../../contexts/cart.context'
import { AuthContext } from '../../contexts/context'
import './cart.scss'

export default function Cart() {
    const { items, removeItem, clear, total, updateQty } = useContext(CartContext)
    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    const [showShipping, setShowShipping] = useState(false)
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const checkout = async () => {
        setError(null)
        if (items.length === 0) {
            setError('Кошик порожній')
            return
        }
        if (!user) {
            setShowLoginPrompt(true)
            return
        }
        setShowShipping(true)
    }

    const handleGuestCheckout = () => {
        setShowLoginPrompt(false)
        setShowShipping(true)
    }

    const handleLoginRedirect = () => {
        navigate('/login', { state: { redirectTo: '/cart' } })
    }

    return (
        <div className='cart-page'>
            <div className='cart-page__header'>
                <h2 className='cart-page__title'>Кошик</h2>
                <Link to='/' className='cart-page__back-link'>
                    ← До головної
                </Link>
            </div>

            {error && <div className='cart-page__error'>{error}</div>}

            {items.length === 0 ? (
                <div className='cart-page__empty'>
                    <p>Кошик порожній.</p>
                    <Link to='/'>Перейти до товарів</Link>
                </div>
            ) : (
                <>
                    <div className='cart-items'>
                        <ul className='cart-items__list'>
                            {items.map(i => (
                                <li key={i.productId} className='cart-item'>
                                    <div className='cart-item__info'>
                                        <div className='cart-item__name'>{i.name}</div>
                                        <div className='cart-item__price-label'>
                                            Ціна: <span>{i.price} ₴</span>
                                        </div>
                                    </div>

                                    <div className='cart-item__quantity'>
                                        <button
                                            className='cart-item__qty-btn'
                                            onClick={() => updateQty(i.productId, i.qty - 1)}
                                        >
                                            −
                                        </button>
                                        <input
                                            type='number'
                                            min={1}
                                            value={i.qty}
                                            onChange={e =>
                                                updateQty(i.productId, Number(e.target.value))
                                            }
                                            className='cart-item__qty-input'
                                        />
                                        <button
                                            className='cart-item__qty-btn'
                                            onClick={() => updateQty(i.productId, i.qty + 1)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className='cart-item__subtotal'>{i.price * i.qty} ₴</div>

                                    <button
                                        className='cart-item__remove-btn'
                                        onClick={() => removeItem(i.productId)}
                                    >
                                        Видалити
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className='cart-summary'>
                        <div className='cart-summary__top'>
                            <button className='cart-summary__clear-btn' onClick={clear}>
                                Очистити кошик
                            </button>
                            <div className='cart-summary__total'>
                                Загальна сума: <span>{total} ₴</span>
                            </div>
                        </div>

                        <div className='cart-summary__checkout'>
                            <button onClick={checkout} className='cart-summary__checkout-btn'>
                                Оформити замовлення
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showLoginPrompt && (
                <div className='login-prompt-overlay'>
                    <div className='login-prompt-modal'>
                        <h3>Оформлення замовлення</h3>
                        <p>
                            Бажаєте увійти, щоб зберегти замовлення в вашому профілі та відстежувати
                            його статус?
                        </p>
                        <div className='login-prompt-actions'>
                            <button className='btn-login' onClick={handleLoginRedirect}>
                                Увійти
                            </button>
                            <button className='btn-guest' onClick={handleGuestCheckout}>
                                Продовжити як гість
                            </button>
                        </div>
                        <button className='btn-close' onClick={() => setShowLoginPrompt(false)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {showShipping && items.length > 0 && (
                <ShippingForm
                    userId={user?.uid || ''}
                    isGuest={!user}
                    items={items}
                    total={total}
                    onSuccess={() => {
                        clear()
                        setShowShipping(false)
                    }}
                    onCancel={() => setShowShipping(false)}
                />
            )}
        </div>
    )
}
