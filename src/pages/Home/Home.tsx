import { useContext, useEffect, useMemo, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import AsideFilter from '../../components/sections/AsideFilter/AsideFilter'
import { CartContext } from '../../contexts/cart.context'
import { AuthContext, DataContext } from '../../contexts/context'
import type { Product } from '../../types'
import './home.scss'

type HomeProps = {
    searchQuery: string
}

type SortValue = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

type FiltersState = {
    minPrice: string
    maxPrice: string
    bestSellerOnly: boolean
    hasImageOnly: boolean
    airSupply: string
    material: string
    glassType: string
    dimensions: string
    chimneyDiameter: string
    sort: SortValue
}

const Home: FC<HomeProps> = ({ searchQuery }) => {
    const data = useContext(DataContext)
    const { addItem } = useContext(CartContext)
    const products = (data?.products ?? []) as Product[]
    const categories = data?.category ?? []

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

    const [filters, setFilters] = useState<FiltersState>({
        minPrice: '',
        maxPrice: '',
        bestSellerOnly: false,
        hasImageOnly: false,
        airSupply: '',
        material: '',
        glassType: '',
        dimensions: '',
        chimneyDiameter: '',
        sort: 'default',
    })

    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    // 1) База для фільтрів по категорії (ОСНОВНЕ)
    const productsInCategory = useMemo(() => {
        return selectedCategoryId
            ? products.filter(p => p.categoryId === selectedCategoryId)
            : products
    }, [products, selectedCategoryId])

    // 2) Хелпер: перевірка чи товар проходить фільтри (з можливістю "пропустити" одне поле)
    const matchesFilters = (p: Product, current: FiltersState, omitKey?: keyof FiltersState) => {
        const min = current.minPrice.trim() ? Number(current.minPrice) : null
        const max = current.maxPrice.trim() ? Number(current.maxPrice) : null

        const bestSellerOk =
            omitKey === 'bestSellerOnly' ? true : !current.bestSellerOnly || !!p.isBestSeller

        const hasImageOk = omitKey === 'hasImageOnly' ? true : !current.hasImageOnly || !!p.imageUrl

        const airOk =
            omitKey === 'airSupply' ? true : !current.airSupply || p.airSupply === current.airSupply
        const materialOk =
            omitKey === 'material' ? true : !current.material || p.material === current.material
        const glassOk =
            omitKey === 'glassType' ? true : !current.glassType || p.glassType === current.glassType
        const dimOk =
            omitKey === 'dimensions'
                ? true
                : !current.dimensions || p.dimensions === current.dimensions
        const chimneyOk =
            omitKey === 'chimneyDiameter'
                ? true
                : !current.chimneyDiameter || p.chimneyDiameter === current.chimneyDiameter

        const minOk = omitKey === 'minPrice' ? true : min === null || Number(p.price) >= min
        const maxOk = omitKey === 'maxPrice' ? true : max === null || Number(p.price) <= max

        return (
            bestSellerOk &&
            hasImageOk &&
            airOk &&
            materialOk &&
            glassOk &&
            dimOk &&
            chimneyOk &&
            minOk &&
            maxOk
        )
    }

    // 3) Опції фільтрів, які залежать від категорії + інших фільтрів (каскадно)
    const filterOptions = useMemo(() => {
        const uniq = (arr: string[]) =>
            Array.from(new Set(arr.map(s => s?.trim()).filter(Boolean))).sort()

        const poolFor = (omitKey: keyof FiltersState) =>
            productsInCategory.filter(p => matchesFilters(p, filters, omitKey))

        return {
            airSupply: uniq(poolFor('airSupply').map(p => p.airSupply || '')),
            material: uniq(poolFor('material').map(p => p.material || '')),
            glassType: uniq(poolFor('glassType').map(p => p.glassType || '')),
            dimensions: uniq(poolFor('dimensions').map(p => p.dimensions || '')),
            chimneyDiameter: uniq(poolFor('chimneyDiameter').map(p => p.chimneyDiameter || '')),
        }
    }, [productsInCategory, filters])

    // 4) Якщо після зміни категорії/фільтрів обране значення "зникло" з опцій — очищаємо його
    const cleanedFilters = useMemo(() => {
        const next = { ...filters }

        if (next.airSupply && !filterOptions.airSupply.includes(next.airSupply))
            next.airSupply = ''
        if (next.material && !filterOptions.material.includes(next.material)) next.material = ''
        if (next.glassType && !filterOptions.glassType.includes(next.glassType))
            next.glassType = ''
        if (next.dimensions && !filterOptions.dimensions.includes(next.dimensions))
            next.dimensions = ''
        if (
            next.chimneyDiameter &&
            !filterOptions.chimneyDiameter.includes(next.chimneyDiameter)
        )
            next.chimneyDiameter = ''

        return next
    }, [filters, filterOptions])

    // 5) Фільтрація + сортування (ваша логіка, але категорію тепер можна не дублювати, бо є productsInCategory)
    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()

        const filteredList = productsInCategory.filter(p => {
            const haystack = `${p.name ?? ''} ${p.description ?? ''}`.toLowerCase()
            const matchesSearch = !q || haystack.includes(q)

            return matchesSearch && matchesFilters(p, filters)
        })

        const sorted = [...filteredList]
        switch (filters.sort) {
            case 'price-asc':
                sorted.sort((a, b) => a.price - b.price)
                break
            case 'price-desc':
                sorted.sort((a, b) => b.price - a.price)
                break
            case 'name-asc':
                sorted.sort((a, b) => a.name.localeCompare(b.name, 'uk'))
                break
            case 'name-desc':
                sorted.sort((a, b) => b.name.localeCompare(a.name, 'uk'))
                break
            default:
                break
        }

        return sorted
    }, [productsInCategory, searchQuery, filters])

    const addToCart = (p: Product) => {
        if (!user) {
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
        <div className='home container'>
            <section className='home__catalog'>
                <AsideFilter
                    filters={filters}
                    setFilters={setFilters}
                    options={filterOptions}
                    onReset={() =>
                        setFilters({
                            minPrice: '',
                            maxPrice: '',
                            bestSellerOnly: false,
                            hasImageOnly: false,
                            airSupply: '',
                            material: '',
                            glassType: '',
                            dimensions: '',
                            chimneyDiameter: '',
                            sort: 'default',
                        })
                    }
                />

                <div className='home__content'>
                    <section className='filters'>
                        <div className='category-filters'>
                            <button
                                className={`filter-btn ${!selectedCategoryId ? 'active' : ''}`}
                                onClick={() => setSelectedCategoryId(null)}
                            >
                                Всі ({products.length})
                            </button>

                            {categories.map(cat => {
                                const count = products.filter(
                                    p => p.categoryId === cat.categoryId,
                                ).length
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

                        <div className='aside-filter__group'>
                            <label className='aside-filter__label'>Сортування</label>
                            <select
                                className='aside-filter__select'
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

                                        <div className='product-info'>
                                            <h3 className='product-name'>{p.name}</h3>

                                            <p className='product-category'>
                                                {
                                                    categories.find(
                                                        c => c.categoryId === p.categoryId,
                                                    )?.name
                                                }
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
            </section>
        </div>
    )
}

export default Home
