import { useContext, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import AsideFilter from '../../components/sections/AsideFilter/AsideFilter'
import ProductList from '../../components/sections/ProductList/ProductList'
import { CartContext } from '../../contexts/cart.context'
import { AuthContext, DataContext } from '../../contexts/context'
import { useProductFilters } from '../../hooks/useProductFilters'
import type { Product } from '../../types'
import './home.scss'
import type { FiltersState, HomeProps } from './type.home'

const Home: FC<HomeProps> = ({ searchQuery }) => {
    const data = useContext(DataContext)
    const { addItem } = useContext(CartContext)
    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

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

    // Використовуємо custom hook для фільтрації
    const { filtered, filterOptions } = useProductFilters(
        products,
        selectedCategoryId,
        filters,
        searchQuery,
    )

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

                <ProductList
                    products={products}
                    filteredProducts={filtered}
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    setSelectedCategoryId={setSelectedCategoryId}
                    filters={filters}
                    setFilters={setFilters}
                    onAddToCart={addToCart}
                />
            </section>
        </div>
    )
}

export default Home
