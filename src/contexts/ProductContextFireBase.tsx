import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState, type ReactNode } from 'react'
import { db } from '../firebase'
import type { Category, Product } from '../types'
import { DataContext } from './context'

export interface dataFirebaseState {
    products: Product[]
    category: Category[]
}

export default function GetDataFirebase({ children }: { children: ReactNode }) {
    const [dataFirebase, setDataFirebase] = useState<dataFirebaseState>({
        products: [],
        category: [],
    })
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const [queryProducts, queryCategory] = await Promise.all([
                    getDocs(collection(db, 'products')),
                    getDocs(collection(db, 'product-categories')),
                ])

                const items: dataFirebaseState = { products: [], category: [] }

                queryProducts.docs.forEach(doc => {
                    const data = doc.data() as Omit<Product, 'id'>
                    items.products.push({ id: doc.id, ...data })
                })

                queryCategory.docs.forEach(doc => {
                    const data = doc.data() as Omit<Category, 'categoryId'>
                    items.category.push({ categoryId: doc.id, ...data })
                })

                setDataFirebase(items)
            } catch (e: any) {
                console.error('Firestore fetch error:', e)
                setError(e?.message ?? 'Помилка доступу до даних')
            }
        }

        fetchProducts()
    }, [])

    return (
        <DataContext.Provider value={{ ...dataFirebase, error } as any}>
            {children}
        </DataContext.Provider>
    )
}
