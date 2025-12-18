export type HomeProps = {
    searchQuery: string
}

export type SortValue = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

export type FiltersState = {
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