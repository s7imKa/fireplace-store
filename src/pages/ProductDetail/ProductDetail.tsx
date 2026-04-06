import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AuthContext } from '../../contexts/auth.context'
import { CartContext } from '../../contexts/cart.context'
import { DataContext } from '../../contexts/context'
import './product-detail.scss'

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { products } = useContext(DataContext)
    const { addItem } = useContext(CartContext)
    const { user } = useContext(AuthContext)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const product = products.find(p => p.id === id)

    if (!product) {
        return (
            <div className='product-detail'>
                <div className='product-detail__error'>
                    <h2>Товар не знайдено</h2>
                    <button onClick={() => navigate('/')} className='product-detail__back-btn'>
                        ← Повернутися на головну
                    </button>
                </div>
            </div>
        )
    }

    // Отримуємо масив зображень (з підтримкою старого формату)
    const images =
        product.images?.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : []

    const nextImage = () => {
        if (images.length > 0) {
            setCurrentImageIndex(prev => (prev + 1) % images.length)
        }
    }

    const prevImage = () => {
        if (images.length > 0) {
            setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)
        }
    }

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login', { state: { redirectTo: `/product-detail/${id}` } })
            return
        }

        const imageUrl = images[0] || ''
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            ...(imageUrl ? { imageUrl } : {}),
        })

        alert(`${product.name} додано в кошик`)
    }

    return (
        <div className='product-detail'>
            <button onClick={() => navigate('/')} className='product-detail__back-btn'>
                ← Назад до каталогу
            </button>

            <div className='product-detail__container'>
                {/* Зображення */}
                <div className='product-detail__image-section'>
                    {images.length > 0 ? (
                        <div className='product-detail__slider'>
                            <img
                                src={images[currentImageIndex]}
                                alt={`${product.name} - фото ${currentImageIndex + 1}`}
                                className='product-detail__image'
                            />

                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className='product-detail__slider-btn product-detail__slider-btn--prev'
                                        aria-label='Попереднє фото'
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className='product-detail__slider-btn product-detail__slider-btn--next'
                                        aria-label='Наступне фото'
                                    >
                                        ›
                                    </button>

                                    <div className='product-detail__slider-dots'>
                                        {images.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`product-detail__slider-dot ${
                                                    index === currentImageIndex ? 'active' : ''
                                                }`}
                                                aria-label={`Перейти до фото ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className='product-detail__no-image'>Немає зображення</div>
                    )}
                    {product.isBestSeller && <div className='product-detail__badge'>Бестселер</div>}
                </div>

                {/* Інформація */}
                <div className='product-detail__info'>
                    <h1 className='product-detail__name'>{product.name}</h1>

                    <div className='product-detail__category'>
                        Категорія: <strong>{product.category}</strong>
                    </div>

                    <div className='product-detail__price'>
                        ₴{product.price.toLocaleString('uk-UA')}
                    </div>

                    <div className='product-detail__description'>
                        <h3>Опис</h3>
                        <p>{product.description}</p>
                    </div>

                    {/* Технічні характеристики */}
                    <div className='product-detail__specs'>
                        <h3>Технічні характеристики</h3>
                        <div className='product-detail__specs-grid'>
                            {product.glassType && (
                                <div className='product-detail__spec-item'>
                                    <span className='product-detail__spec-label'>Тип скла:</span>
                                    <span className='product-detail__spec-value'>
                                        {product.glassType}
                                    </span>
                                </div>
                            )}
                            {product.material && (
                                <div className='product-detail__spec-item'>
                                    <span className='product-detail__spec-label'>Матеріал:</span>
                                    <span className='product-detail__spec-value'>
                                        {product.material}
                                    </span>
                                </div>
                            )}
                            {product.airSupply && (
                                <div className='product-detail__spec-item'>
                                    <span className='product-detail__spec-label'>
                                        Подача повітря:
                                    </span>
                                    <span className='product-detail__spec-value'>
                                        {product.airSupply}
                                    </span>
                                </div>
                            )}
                            {product.dimensions && (
                                <div className='product-detail__spec-item'>
                                    <span className='product-detail__spec-label'>Розміри:</span>
                                    <span className='product-detail__spec-value'>
                                        {product.dimensions}
                                    </span>
                                </div>
                            )}
                            {product.chimneyDiameter && (
                                <div className='product-detail__spec-item'>
                                    <span className='product-detail__spec-label'>
                                        Діаметр дымоходу:
                                    </span>
                                    <span className='product-detail__spec-value'>
                                        {product.chimneyDiameter}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Дія */}
                    <div className='product-detail__actions'>
                        <button onClick={handleAddToCart} className='product-detail__add-btn'>
                            Додати в кошик
                        </button>
                    </div>
                </div>
            </div>

            <div className='product-detail__characteristics'>
                <h3>Xарактенристики</h3>
                <p>{product.characteristics}</p>
            </div>
        </div>
    )
}
