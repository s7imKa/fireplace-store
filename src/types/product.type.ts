export interface Product {
    id: string
    categoryId: string
    category: string
    name: string
    price: number
    description: string
    imageUrl: string

    // ДОДАНО: технічні характеристики
    isBestSeller: boolean
    glassType: string
    material: string
    airSupply: string
    dimensions: string
    chimneyDiameter: string
}
