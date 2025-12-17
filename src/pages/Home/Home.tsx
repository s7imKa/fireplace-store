import { useContext, useState, type FC } from 'react'
import { CartContext } from '../../contexts/cart.context'
import { AuthContext, DataContext } from '../../contexts/context'
import './home.scss'
import {useNavigate} from "react-router-dom";
import AsideFilter from '../../components/sections/AsideFilter/AsideFilter'

type HomeProps = {
    searchQuery: string
}

const Home: FC<HomeProps> = ({ searchQuery }) => {
    const data = useContext(DataContext)
    const { addItem } = useContext(CartContext)
    const products = data?.products ?? []
    const categories = data?.category ?? []

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


            <AsideFilter />
            
            
            <section className='filters'>
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

export default Home
