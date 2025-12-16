import { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CartContext } from '../../contexts/cart.context'
import { signInEmail, signInGoogle, signUpEmail } from '../../hooks/useAuthActions'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [info, setInfo] = useState<string | null>(null)
    const navigate = useNavigate()
    const location = useLocation()
    const { addItem } = useContext(CartContext)

    const doPostLoginReturn = (resultUserEmail?: string) => {
        // якщо адмін – на адмін-панель
        const isAdmin = (resultUserEmail || email)?.toLowerCase() === 'admin@gmail.com'
        const state = (location.state as any) || {}

        if (isAdmin) {
            navigate('/admin-panel', { replace: true })
            return
        }

        // якщо прийшли зі спробою додати товар — додаємо й повертаємо
        if (state?.action === 'addToCart' && state?.product) {
            const p = state.product
            addItem({
                productId: p.id,
                name: p.name,
                price: p.price,
                qty: 1,
                ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
            })
            navigate(state.redirectTo || '/', { replace: true })
        } else {
            navigate(state.redirectTo || '/', { replace: true })
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setInfo(null)
        try {
            if (!email || !password) {
                setError('Введіть email і пароль')
                return
            }
            if (mode === 'login') {
                await signInEmail(email, password)
                doPostLoginReturn(email)
            } else {
                await signUpEmail(email, password)
                setInfo('Реєстрація успішна. Тепер увійдіть.')
                setMode('login')
            }
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string } | null
            const code = err?.code ?? ''
            const msg =
                code === 'auth/invalid-credential'
                    ? 'Невірний email або пароль'
                    : code === 'auth/email-already-in-use'
                    ? 'Email вже використовується'
                    : code === 'auth/operation-not-allowed'
                    ? 'Email/Password не увімкнено в Firebase'
                    : code === 'auth/weak-password'
                    ? 'Занадто слабкий пароль (мінімум 6)'
                    : err?.message ?? 'Сталася помилка'
            setError(msg)
        }
    }

    const handleGoogleSignIn = async () => {
        setError(null)
        setInfo(null)
        try {
            const result = await signInGoogle()
            doPostLoginReturn(result.user.email || undefined)
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string } | null
            const msg = err?.message ?? 'Помилка входу через Google'
            setError(msg)
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '100px auto' }}>
            <h2>{mode === 'login' ? 'Вхід' : 'Реєстрація'}</h2>
            <form onSubmit={onSubmit}>
                <input
                    placeholder='Email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: 8, marginBottom: 12 }}
                />
                <input
                    placeholder='Пароль'
                    type='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', padding: 8, marginBottom: 12 }}
                />
                <button type='submit' style={{ width: '100%', padding: 10 }}>
                    {mode === 'login' ? 'Увійти' : 'Зареєструватися'}
                </button>
            </form>

            {mode === 'login' && (
                <button
                    onClick={handleGoogleSignIn}
                    style={{ width: '100%', marginTop: 12, padding: 10 }}
                >
                    Увійти з Google
                </button>
            )}

            <div style={{ marginTop: 12 }}>
                <button
                    type='button'
                    onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login')
                        setError(null)
                        setInfo(null)
                    }}
                    style={{ width: '100%', padding: 10 }}
                >
                    {mode === 'login' ? 'Перейти до реєстрації' : 'Перейти до входу'}
                </button>
            </div>

            {info && <p style={{ color: 'green', marginTop: 12 }}>{info}</p>}
            {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
        </div>
    )
}
