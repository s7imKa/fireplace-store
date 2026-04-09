import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/context'
import { db } from '../../firebase'
import { uploadImageToImgBB } from '../../hooks/useImgBB'
import type { Category } from '../../types/category.type'
import type { Product } from '../../types/product.type'
import './AdminPanel.scss'

interface FormState {
    id?: string
    name: string
    price: number
    description: string
    images: string[] // ОНОВЛЕНО: масив зображень
    categoryId: string
    isBestSeller: boolean
    glassType: string
    material: string
    airSupply: string
    dimensions: string
    chimneyDiameter: string
    characteristics: string
}

interface CategoryFormState {
    id?: string
    name: string
}

export default function AdminPanel() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

    const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')

    const empty: FormState = useMemo(
        () => ({
            name: '',
            price: 0,
            description: '',
            images: [],
            categoryId: '',
            isBestSeller: false,
            glassType: '',
            material: '',
            airSupply: '',
            dimensions: '',
            chimneyDiameter: '',
            characteristics: '',
        }),
        [],
    )

    const emptyCategory: CategoryFormState = { name: '' }

    const [form, setForm] = useState<FormState>(empty)
    const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategory)

    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const { loading, isAdmin } = useContext(AuthContext)

    // Завантаження даних
    useEffect(() => {
        const load = async () => {
            try {
                const [prodSnap, catSnap] = await Promise.all([
                    getDocs(collection(db, 'products')),
                    getDocs(collection(db, 'product-categories')),
                ])
                const ps: Product[] = []
                prodSnap.forEach(d => ps.push({ id: d.id, ...(d.data() as any) }))
                const cs: Category[] = []
                catSnap.forEach(d => cs.push({ categoryId: d.id, ...(d.data() as any) }))
                setProducts(ps)
                setCategories(cs)
            } catch (e: any) {
                setError(e?.message ?? 'Помилка завантаження даних')
            }
        }
        load()
    }, [])

    // Групування товарів по категоріям
    const productsByCategory = useMemo(() => {
        const grouped: { [key: string]: Product[] } = {}
        products.forEach(p => {
            const catId = p.categoryId || 'uncategorized'
            if (!grouped[catId]) grouped[catId] = []
            grouped[catId].push(p)
        })
        return grouped
    }, [products])

    // Фільтровані товари
    const filteredProducts = useMemo(() => {
        if (!selectedCategoryId) return products
        return products.filter(p => p.categoryId === selectedCategoryId)
    }, [products, selectedCategoryId])

    // ===== УПРАВЛІННЯ ТОВАРАМИ =====

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const newFiles = Array.from(files)
        setImageFiles(prev => [...prev, ...newFiles])
        setError(null)

        // Створюємо попередні перегляди
        newFiles.forEach(file => {
            const reader = new FileReader()
            reader.onload = event => {
                setImagePreviews(prev => [...prev, event.target?.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingImage = (index: number) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }))
    }

    const validate = (): string | null => {
        if (!form.name?.trim()) return 'Вкажіть назву товару'
        if (!form.price || form.price <= 0) return 'Вкажіть коректну ціну'
        if (!form.categoryId) return 'Оберіть категорію'
        if (imageFiles.length === 0 && form.images.length === 0)
            return 'Завантажте хоча б одне зображення'
        return null
    }

    const save = async () => {
        setError(null)
        setSuccessMsg(null)
        const v = validate()
        if (v) {
            setError(v)
            return
        }

        setSaving(true)
        try {
            const uploadedImages = [...form.images]

            // Завантажуємо нові файли
            if (imageFiles.length > 0) {
                setUploading(true)
                for (const file of imageFiles) {
                    const url = await uploadImageToImgBB(file)
                    uploadedImages.push(url)
                }
                setUploading(false)
            }

            const productData = {
                name: form.name?.trim(),
                price: form.price,
                description: form.description?.trim(),
                images: uploadedImages,
                imageUrl: uploadedImages[0] || '', // backward compatibility
                categoryId: form.categoryId,
                category: categories.find(c => c.categoryId === form.categoryId)?.name ?? '',
                isBestSeller: !!form.isBestSeller,
                glassType: form.glassType?.trim() || '',
                material: form.material?.trim() || '',
                airSupply: form.airSupply?.trim() || '',
                dimensions: form.dimensions?.trim() || '',
                chimneyDiameter: form.chimneyDiameter?.trim() || '',
                characteristics: form.characteristics?.trim() || '',
            }

            if (form.id) {
                const ref = doc(db, 'products', form.id)
                await updateDoc(ref, productData)
            } else {
                await addDoc(collection(db, 'products'), productData)
            }

            const snap = await getDocs(collection(db, 'products'))
            const ps: Product[] = []
            snap.forEach(d => ps.push({ id: d.id, ...(d.data() as any) }))
            setProducts(ps)

            reset()
            setSuccessMsg('Товар збережено ✓')
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (e: any) {
            setError(e?.message ?? 'Помилка збереження')
            console.error('Save error:', e)
        } finally {
            setSaving(false)
            setUploading(false)
        }
    }

    const edit = (p: Product) => {
        setForm({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
            images: p.images || (p.imageUrl ? [p.imageUrl] : []),
            categoryId: p.categoryId,
            isBestSeller: !!p.isBestSeller,
            glassType: p.glassType || '',
            material: p.material || '',
            airSupply: p.airSupply || '',
            dimensions: p.dimensions || '',
            chimneyDiameter: p.chimneyDiameter || '',
            characteristics: p.characteristics || '',
        })
        setImageFiles([])
        setImagePreviews([])
        setActiveTab('products')
    }

    const reset = () => {
        setForm(empty)
        setImageFiles([])
        setImagePreviews([])
    }

    const deleteProduct = async (id: string) => {
        if (!confirm('Видалити товар?')) return
        try {
            await deleteDoc(doc(db, 'products', id))
            setProducts(prev => prev.filter(p => p.id !== id))
            setSuccessMsg('Товар видалено ✓')
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (e: any) {
            setError(e?.message ?? 'Помилка видалення')
        }
    }

    // ===== УПРАВЛІННЯ КАТЕГОРІЯМИ =====

    const validateCategory = (): string | null => {
        if (!categoryForm.name?.trim()) return 'Вкажіть назву категорії'
        return null
    }

    const saveCategory = async () => {
        setError(null)
        setSuccessMsg(null)
        const v = validateCategory()
        if (v) {
            setError(v)
            return
        }

        setSaving(true)
        try {
            if (categoryForm.id) {
                const ref = doc(db, 'product-categories', categoryForm.id)
                await updateDoc(ref, { name: categoryForm.name?.trim() })
            } else {
                await addDoc(collection(db, 'product-categories'), {
                    name: categoryForm.name?.trim(),
                })
            }

            const snap = await getDocs(collection(db, 'product-categories'))
            const cs: Category[] = []
            snap.forEach(d => cs.push({ categoryId: d.id, ...(d.data() as any) }))
            setCategories(cs)

            setCategoryForm(emptyCategory)
            setSuccessMsg('Категорія збережена ✓')
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (e: any) {
            setError(e?.message ?? 'Помилка збереження категорії')
        } finally {
            setSaving(false)
        }
    }

    const editCategory = (c: Category) => {
        setCategoryForm({ id: c.categoryId, name: c.name })
        setActiveTab('categories')
    }

    const deleteCategory = async (id: string) => {
        if (!confirm('Видалити категорію?')) return
        try {
            await deleteDoc(doc(db, 'product-categories', id))
            setCategories(prev => prev.filter(c => c.categoryId !== id))
            setSuccessMsg('Категорія видалена ✓')
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (e: any) {
            setError(e?.message ?? 'Помилка видалення категорії')
        }
    }

    const resetCategory = () => {
        setCategoryForm(emptyCategory)
    }

    if (loading) {
        return <div className='admin-panel container'>Завантаження...</div>
    }

    if (!isAdmin) {
        return <Navigate to='/' replace />
    }

    return (
        <div className='admin-panel container'>
            {/* ТАБУЛЯЦІЯ */}
            <div className='admin-panel__tabs'>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`admin-panel__tab-btn ${
                        activeTab === 'products' ? 'admin-panel__tab-btn--active' : ''
                    }`}
                >
                    📦 Товари ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`admin-panel__tab-btn ${
                        activeTab === 'categories' ? 'admin-panel__tab-btn--active' : ''
                    }`}
                >
                    🏷️ Категорії ({categories.length})
                </button>
            </div>

            {/* ПОВІДОМЛЕННЯ */}
            {error && (
                <div className='admin-panel__message admin-panel__message--error'>⚠️ {error}</div>
            )}
            {successMsg && (
                <div className='admin-panel__message admin-panel__message--success'>
                    {successMsg}
                </div>
            )}

            {/* ТАБ: ТОВАРИ */}
            {activeTab === 'products' && (
                <div className='admin-panel__content'>
                    {/* Карточка: Основна інформація */}
                    <div className='admin-panel__card'>
                        <h3>Основна інформація</h3>
                        <div className='admin-panel__form'>
                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Назва товару*</label>
                                <input
                                    type='text'
                                    className='admin-panel__input'
                                    placeholder='Напр., Камінна топка Optima 700'
                                    value={form.name || ''}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Ціна (₴)*</label>
                                <input
                                    type='number'
                                    className='admin-panel__input'
                                    placeholder='Напр., 18999'
                                    value={form.price || 0}
                                    onChange={e =>
                                        setForm(f => ({ ...f, price: Number(e.target.value) }))
                                    }
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Категорія*</label>
                                <select
                                    className='admin-panel__select'
                                    value={form.categoryId || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, categoryId: e.target.value }))
                                    }
                                >
                                    <option value=''>Оберіть категорію...</option>
                                    {categories.map(c => (
                                        <option key={c.categoryId} value={c.categoryId}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>
                                    Фото товару* (JPG, PNG, WebP, GIF) - можна обрати декілька
                                </label>
                                <input
                                    type='file'
                                    accept='image/jpeg,image/png,image/webp,image/gif'
                                    onChange={handleImageSelect}
                                    disabled={uploading || saving}
                                    multiple
                                />

                                {/* Попередній перегляд нових фото */}
                                {imagePreviews.length > 0 && (
                                    <div className='admin-panel__images-grid'>
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className='admin-panel__image-preview'>
                                                <img src={preview} alt={`Preview ${index + 1}`} />
                                                <button
                                                    type='button'
                                                    onClick={() => removeImage(index)}
                                                    className='admin-panel__image-remove'
                                                    disabled={uploading || saving}
                                                >
                                                    ✕
                                                </button>
                                                <div className='admin-panel__image-preview-text'>
                                                    📤 Готово до завантаження
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Вже завантажені фото */}
                                {form.images.length > 0 && (
                                    <div className='admin-panel__images-grid'>
                                        {form.images.map((url, index) => (
                                            <div key={index} className='admin-panel__image-preview'>
                                                <img src={url} alt={`Фото ${index + 1}`} />
                                                <button
                                                    type='button'
                                                    onClick={() => removeExistingImage(index)}
                                                    className='admin-panel__image-remove'
                                                    disabled={uploading || saving}
                                                >
                                                    ✕
                                                </button>
                                                <div className='admin-panel__image-status'>
                                                    ✓ Завантажено
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Опис</label>
                                <textarea
                                    className='admin-panel__textarea'
                                    placeholder='Короткий опис особливостей та переваг...'
                                    value={form.description || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, description: e.target.value }))
                                    }
                                    rows={4}
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>
                                    Загальні характеристики
                                </label>
                                <textarea
                                    className='admin-panel__input'
                                    placeholder='Напр., Настінний '
                                    value={form.characteristics || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, characteristics: e.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        <div className='admin-panel__form-actions'>
                            <button
                                onClick={save}
                                disabled={saving || uploading}
                                className='admin-panel__btn admin-panel__btn--primary'
                            >
                                {uploading
                                    ? '📤 Завантаження фото...'
                                    : saving
                                    ? '💾 Збереження...'
                                    : form.id
                                    ? '✏️ Оновити'
                                    : '➕ Додати'}
                            </button>
                            {form.id && (
                                <button
                                    onClick={reset}
                                    disabled={saving}
                                    className='admin-panel__btn admin-panel__btn--secondary'
                                >
                                    ✕ Скасувати
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Карточка: Технічні характеристики */}
                    <div className='admin-panel__card'>
                        <h3>Технічні характеристики</h3>
                        <div className='admin-panel__form'>
                            <label className='admin-panel__checkbox-label'>
                                <input
                                    type='checkbox'
                                    checked={!!form.isBestSeller}
                                    onChange={e =>
                                        setForm(f => ({ ...f, isBestSeller: e.target.checked }))
                                    }
                                />
                                Хіт продажу
                            </label>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Форма скла</label>
                                <input
                                    type='text'
                                    className='admin-panel__input'
                                    placeholder='Напр., Пряме / Кутове / П-подібне'
                                    value={form.glassType || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, glassType: e.target.value }))
                                    }
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Матеріал виготовлення</label>
                                <input
                                    type='text'
                                    className='admin-panel__input'
                                    placeholder='Напр., Сталь / Чавун'
                                    value={form.material || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, material: e.target.value }))
                                    }
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Підведення повітря</label>
                                <input
                                    type='text'
                                    className='admin-panel__input'
                                    placeholder='Напр., Зовнішнє / Примусове'
                                    value={form.airSupply || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, airSupply: e.target.value }))
                                    }
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Розміри та форма</label>
                                <input
                                    type='text'
                                    className='admin-panel__input'
                                    placeholder='Напр., 700×450 мм, кутова'
                                    value={form.dimensions || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, dimensions: e.target.value }))
                                    }
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Діаметр димоходу</label>
                                <input
                                    type='text'
                                    className='admin-panel__input'
                                    placeholder='Напр., 180 мм'
                                    value={form.chimneyDiameter || ''}
                                    onChange={e =>
                                        setForm(f => ({ ...f, chimneyDiameter: e.target.value }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* СПИСОК ТОВАРІВ З ФІЛЬТРУВАННЯМ */}
                    <div className='admin-panel__list'>
                        <h3>📦 Товари</h3>

                        {/* ФІЛЬТР */}
                        <div className='admin-panel__category-filters'>
                            <button
                                onClick={() => setSelectedCategoryId(null)}
                                className={`admin-panel__filter-btn ${
                                    selectedCategoryId === null
                                        ? 'admin-panel__filter-btn--active'
                                        : ''
                                }`}
                            >
                                Всі ({products.length})
                            </button>
                            {categories.map(c => (
                                <button
                                    key={c.categoryId}
                                    onClick={() => setSelectedCategoryId(c.categoryId)}
                                    className={`admin-panel__filter-btn ${
                                        selectedCategoryId === c.categoryId
                                            ? 'admin-panel__filter-btn--active'
                                            : ''
                                    }`}
                                >
                                    {c.name} ({productsByCategory[c.categoryId]?.length ?? 0})
                                </button>
                            ))}
                        </div>

                        <div className='admin-panel__items'>
                            {filteredProducts.length === 0 ? (
                                <p className='admin-panel__no-items'>Товарів нема</p>
                            ) : (
                                filteredProducts.map(p => (
                                    <div key={p.id} className='admin-panel__item'>
                                        <div className='admin-panel__item-content'>
                                            {p.imageUrl && (
                                                <img
                                                    src={p.imageUrl}
                                                    alt={p.name}
                                                    className='admin-panel__item-image'
                                                />
                                            )}
                                            <div className='admin-panel__item-info'>
                                                <h4>{p.name}</h4>
                                                <p className='admin-panel__item-info-meta'>
                                                    {p.category} · <b>{p.price} ₴</b>
                                                </p>
                                                <p>{p.description?.substring(0, 60)}...</p>
                                            </div>
                                            <div className='admin-panel__item-actions'>
                                                <button
                                                    onClick={() => edit(p)}
                                                    className='admin-panel__action-btn admin-panel__action-btn--edit'
                                                >
                                                    ✏️ Редагувати
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(p.id)}
                                                    className='admin-panel__action-btn admin-panel__action-btn--delete'
                                                >
                                                    🗑️ Видалити
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ТАБ: КАТЕГОРІЇ */}
            {activeTab === 'categories' && (
                <div className='admin-panel__content'>
                    {/* ФОРМА КАТЕГОРІЇ */}
                    <div className='admin-panel__card'>
                        <h3>
                            {categoryForm.id ? '✏️ Редагувати категорію' : '➕ Додати категорію'}
                        </h3>

                        <div className='admin-panel__form'>
                            <div className='admin-panel__form-group'>
                                <label className='admin-panel__label'>Назва категорії*</label>
                                <input
                                    type='text'
                                    className='admin-panel__input'
                                    placeholder='Назва категорії...'
                                    value={categoryForm.name || ''}
                                    onChange={e =>
                                        setCategoryForm(f => ({ ...f, name: e.target.value }))
                                    }
                                />
                            </div>

                            <div className='admin-panel__form-actions'>
                                <button
                                    onClick={saveCategory}
                                    disabled={saving}
                                    className='admin-panel__btn admin-panel__btn--primary'
                                >
                                    {saving
                                        ? '💾 Збереження...'
                                        : categoryForm.id
                                        ? '✏️ Оновити'
                                        : '➕ Додати'}
                                </button>

                                {categoryForm.id && (
                                    <button
                                        onClick={resetCategory}
                                        disabled={saving}
                                        className='admin-panel__btn admin-panel__btn--secondary'
                                    >
                                        ✕ Скасувати
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* СПИСОК КАТЕГОРІЙ */}
                    <div className='admin-panel__list'>
                        <h3>🏷️ Категорії ({categories.length})</h3>
                        <div className='admin-panel__items'>
                            {categories.length === 0 ? (
                                <p className='admin-panel__no-items'>Категорій нема</p>
                            ) : (
                                categories.map(c => (
                                    <div key={c.categoryId} className='admin-panel__category-item'>
                                        <div className='admin-panel__category-info'>
                                            <h4>{c.name}</h4>
                                            <p>
                                                {productsByCategory[c.categoryId]?.length ?? 0}{' '}
                                                товарів
                                            </p>
                                        </div>
                                        <div className='admin-panel__category-actions'>
                                            <button
                                                onClick={() => editCategory(c)}
                                                className='admin-panel__action-btn admin-panel__action-btn--edit'
                                            >
                                                ✏️ Редагувати
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(c.categoryId)}
                                                className='admin-panel__action-btn admin-panel__action-btn--delete'
                                            >
                                                🗑️ Видалити
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
