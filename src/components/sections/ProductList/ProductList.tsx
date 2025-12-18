import type { Dispatch, FC, SetStateAction } from 'react'
import { SlBasket } from 'react-icons/sl'
import type { FiltersState, SortValue } from '../../../pages/Home/type.home'
import type { Category, Product } from '../../../types'
import './ProductList.scss'

type Props = {
    products: Product[]
    filteredProducts: Product[]
    categories: Category[]
    selectedCategoryId: string | null
    setSelectedCategoryId: Dispatch<SetStateAction<string | null>>
    filters: FiltersState
    setFilters: Dispatch<SetStateAction<FiltersState>>
    onAddToCart: (product: Product) => void
}

const ProductList: FC<Props> = ({
    products,
    filteredProducts,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    filters,
    setFilters,
    onAddToCart,
}) => {
    return (
        <div className='product-list'>
            <section className='product-list__filters'>
                <div className='product-list__category-filters'>
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

                <div className='product-list__sort'>
                    <label className='product-list__sort-label'>Cортування:</label>
                    <select
                        className='product-list__sort-select'
                        value={filters.sort}
                        onChange={e =>
                            setFilters(prev => ({
                                ...prev,
                                sort: e.target.value as SortValue,
                            }))
                        }
                    >
                        <option value='default'>За замовчуванням</option>
                        <option value='price-asc'>Ціна: зростання</option>
                        <option value='price-desc'>Ціна: спадання</option>
                        <option value='name-asc'>Назва: А–Я</option>
                        <option value='name-desc'>Назва: Я–А</option>
                    </select>
                </div>
            </section>

            <section className='product-list__products'>
                {filteredProducts.length === 0 ? (
                    <div className='product-list__no-products'>
                        <p>Товари не знайдені</p>
                    </div>
                ) : (
                    <div className='product-list__grid'>
                        {filteredProducts.map(p => {
                            const isHit = !!p.isBestSeller
                            const discounted = Math.round(p.price * 1.05)

                            return (
                                <div key={p.id} className='product-card'>
                                    {isHit && (
                                        <>
                                            <span className='product-card__badge'>Хіт продажу</span>
                                            <span className='product-card__discount-chip'>
                                                -10%
                                            </span>
                                        </>
                                    )}

                                    {p.imageUrl && (
                                        <div className='product-card__image'>
                                            <img src={p.imageUrl} alt={p.name} />
                                        </div>
                                    )}

                                    <div className='product-card__info'>
                                        <h3 className='product-card__name'>{p.name}</h3>

                                        <div className='product-card__specs'>
                                            {p.material && (
                                                <p className='product-card__spec'>
                                                    <span>Матеріал:</span> {p.material}
                                                </p>
                                            )}
                                            {p.dimensions && (
                                                <p className='product-card__spec'>
                                                    <span>Розмір фасаду, ШхВ:</span> {p.dimensions}
                                                </p>
                                            )}
                                            {p.glassType && (
                                                <p className='product-card__spec'>
                                                    <span>Форма:</span> {p.glassType}
                                                </p>
                                            )}
                                            {p.airSupply && (
                                                <p className='product-card__spec'>
                                                    <span>Підведення повітря:</span> {p.airSupply}
                                                </p>
                                            )}
                                            {p.chimneyDiameter && (
                                                <p className='product-card__spec'>
                                                    <span>Діаметр димоходу:</span>{' '}
                                                    {p.chimneyDiameter}
                                                </p>
                                            )}
                                            <p className='product-card__spec'>
                                                <span>Країна виробник:</span> Польща
                                            </p>
                                        </div>

                                        <div className='product-card__footer'>
                                            {isHit ? (
                                                <div className='product-card__price-block'>
                                                    <span className='product-card__price-old'>
                                                        {discounted}
                                                        <span className='product-card__price-grn'>
                                                            грн
                                                        </span>
                                                    </span>
                                                    <span className='product-card__price-new'>
                                                        {p.price}{' '}
                                                        <span className='product-card__price-grn'>
                                                            грн
                                                        </span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className='product-card__price'>
                                                    {p.price}{' '}
                                                    <span className='product-card__price-grn'>
                                                        грн
                                                    </span>
                                                </span>
                                            )}

                                            <button
                                                className='product-card__add-btn'
                                                onClick={() => onAddToCart(p)}
                                            >
                                                <SlBasket className='product-card__add-btn-bascet' />
                                                В кошик
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

export default ProductList
