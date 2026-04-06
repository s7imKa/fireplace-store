export interface Product {
    id: string
    categoryId: string
    category: string
    name: string
    price: number
    description: string
    imageUrl?: string // backward compatibility
    images: string[] // НОВЕ: масив зображень

    // ДОДАНО: технічні характеристики
    isBestSeller: boolean
    glassType: string
    material: string
    airSupply: string
    dimensions: string
    chimneyDiameter: string
    characteristics: string
}
