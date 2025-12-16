import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartContext } from '../../contexts/cart.context'
import { AuthContext, DataContext } from '../../contexts/context'
import { logout } from '../../hooks/useAuthActions'
import './home.scss'

export default function Home() {
    const data = useContext(DataContext)
    const { addItem } = useContext(CartContext)
    const products = data?.products ?? []
    const categories = data?.category ?? []

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    // Фільтрація товарів
    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategoryId || p.categoryId === selectedCategoryId
        return matchesSearch && matchesCategory
    })

    const addToCart = (p: any) => {
        if (!user) {
            // редірект на логін і передаємо намір додати товар
            navigate('/login', { state: { redirectTo: '/', action: 'addToCart', product: p } })
            return
        }
        addItem({
            productId: p.id,
            name: p.name,
            price: p.price,
            qty: 1,
            ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
        })
        alert(`${p.name} додано в кошик`)
    }

    return (
        <div className='home'>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                {user ? (
                    <>
                        <span>{user?.email ?? user?.displayName}</span>
                        <button onClick={() => logout()}>Вийти</button>
                        <Link to='/profile' style={{ marginLeft: 8 }}>
                            Профіль
                        </Link>
                        <Link to='/cart' style={{ marginLeft: 8 }}>
                            Кошик
                        </Link>
                    </>
                ) : (
                    <>
                        <button onClick={() => navigate('/login')}>Увійти</button>
                        <Link to='/cart' style={{ marginLeft: 8 }}>
                            Кошик
                        </Link>
                    </>
                )}
            </div>

            <section className='hero'>
                <h1>Магазин камінних топок</h1>
                <p>Знайдіть ідеальну каміну для вашого дому</p>
            </section>

            <section className='filters'>
                <div className='search-box'>
                    <input
                        type='text'
                        placeholder='🔍 Пошук товарів...'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className='search-input'
                    />
                </div>

                <div className='category-filters'>
                    <button
                        className={`filter-btn ${!selectedCategoryId ? 'active' : ''}`}
                        onClick={() => setSelectedCategoryId(null)}
                    >
                        Всі ({products.length})
                    </button>
                    {categories.map(cat => {
                        const count = products.filter(p => p.categoryId === cat.categoryId).length
                        return (
                            <button
                                key={cat.categoryId}
                                className={`filter-btn ${
                                    selectedCategoryId === cat.categoryId ? 'active' : ''
                                }`}
                                onClick={() => setSelectedCategoryId(cat.categoryId)}
                            >
                                {cat.name} ({count})
                            </button>
                        )
                    })}
                </div>
            </section>

            <section className='products'>
                {filtered.length === 0 ? (
                    <div className='no-products'>
                        <p>Товари не знайдені</p>
                    </div>
                ) : (
                    <div className='products-grid'>
                        {filtered.map(p => (
                            <div key={p.id} className='product-card'>
                                {p.imageUrl && (
                                    <div className='product-image'>
                                        <img src={p.imageUrl} alt={p.name} />
                                    </div>
                                )}
                                <p>{p.airSupply}</p>
                                <div className='product-info'>
                                    <h3 className='product-name'>{p.name}</h3>
                                    <p className='product-category'>
                                        {categories.find(c => c.categoryId === p.categoryId)?.name}
                                    </p>
                                    <p className='product-description'>{p.description}</p>
                                    <div className='product-footer'>
                                        <span className='product-price'>{p.price} ₴</span>
                                        <button
                                            className='add-to-cart-btn'
                                            onClick={() => addToCart(p)}
                                        >
                                            + Кошик
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
