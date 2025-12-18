import { useCallback, useMemo } from 'react'
import type { FiltersState } from '../pages/Home/type.home'
import type { Product } from '../types'

export function useProductFilters(
    products: Product[],
    selectedCategoryId: string | null,
    filters: FiltersState,
    searchQuery: string,
) {
    // 1) База для фільтрів по категорії (ОСНОВНЕ)
    const productsInCategory = useMemo(() => {
        return selectedCategoryId
            ? products.filter(p => p.categoryId === selectedCategoryId)
            : products
    }, [products, selectedCategoryId])

    // 2) Хелпер: перевірка чи товар проходить фільтри (з можливістю "пропустити" одне поле)
    const matchesFilters = useCallback(
        (p: Product, current: FiltersState, omitKey?: keyof FiltersState) => {
            const min = current.minPrice.trim() ? Number(current.minPrice) : null
            const max = current.maxPrice.trim() ? Number(current.maxPrice) : null

            const bestSellerOk =
                omitKey === 'bestSellerOnly' ? true : !current.bestSellerOnly || !!p.isBestSeller

            const hasImageOk =
                omitKey === 'hasImageOnly' ? true : !current.hasImageOnly || !!p.imageUrl

            const airOk =
                omitKey === 'airSupply'
                    ? true
                    : !current.airSupply || p.airSupply === current.airSupply
            const materialOk =
                omitKey === 'material' ? true : !current.material || p.material === current.material
            const glassOk =
                omitKey === 'glassType'
                    ? true
                    : !current.glassType || p.glassType === current.glassType
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
        },
        [],
    )

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
    }, [productsInCategory, filters, matchesFilters])

    // 4) Фільтрація + сортування
    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()

        const filteredList = productsInCategory.filter(p => {
            const haystack = `${p.name ?? ''} ${p.description ?? ''}`.toLowerCase()
            const matchesSearch = !q || haystack.includes(q)

            return matchesSearch && matchesFilters(p, filters)
        })

        // Хіти продаж першими, далі інші — кожна група сортується за поточним вибором
        const sortBy = (a: Product, b: Product) => {
            switch (filters.sort) {
                case 'price-asc':
                    return a.price - b.price
                case 'price-desc':
                    return b.price - a.price
                case 'name-asc':
                    return a.name.localeCompare(b.name, 'uk')
                case 'name-desc':
                    return b.name.localeCompare(a.name, 'uk')
                default:
                    return 0
            }
        }

        const hits = filteredList.filter(p => p.isBestSeller)
        const others = filteredList.filter(p => !p.isBestSeller)

        hits.sort(sortBy)
        others.sort(sortBy)

        return [...hits, ...others]
    }, [productsInCategory, searchQuery, filters, matchesFilters])

    return {
        filtered,
        filterOptions,
        productsInCategory,
    }
}
