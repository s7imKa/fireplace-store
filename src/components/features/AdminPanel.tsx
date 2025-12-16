import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AuthContext } from '../../contexts/context'
import { db } from '../../firebase'
import { uploadImageToImgBB } from '../../hooks/useImgBB'
import type { Category } from '../../types/category.type'
import type { Product } from '../../types/product.type'

interface FormState {
    id?: string
    name: string
    price: number
    description: string
    imageUrl: string
    categoryId: string
    // ДОДАНО: технічні характеристики
    isBestSeller: boolean
    glassType: string
    material: string
    airSupply: string
    dimensions: string
    chimneyDiameter: string
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
            imageUrl: '',
            categoryId: '',
            isBestSeller: false,
            glassType: '',
            material: '',
            airSupply: '',
            dimensions: '',
            chimneyDiameter: '',
        }),
        [],
    )

    const emptyCategory: CategoryFormState = { name: '' }

    const [form, setForm] = useState<FormState>(empty)
    const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategory)

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    // Перевірка прав адміна
    useEffect(() => {
        if (user?.email?.toLowerCase() !== 'admin@gmail.com') {
            navigate('/')
        }
    }, [user, navigate])

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
        const file = e.target.files?.[0]
        if (!file) return

        setImageFile(file)
        setError(null)

        const reader = new FileReader()
        reader.onload = event => {
            setImagePreview(event.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const validate = (): string | null => {
        if (!form.name?.trim()) return 'Вкажіть назву товару'
        if (!form.price || form.price <= 0) return 'Вкажіть коректну ціну'
        if (!form.categoryId) return 'Оберіть категорію'
        if (!imageFile && !form.imageUrl) return 'Завантажте зображення'
        // технічні поля опційні, можна додати правила за потреби
        return null
    }

    // Збереження товару у Firestore з новими полями
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
            let imageUrl = form.imageUrl

            if (imageFile) {
                setUploading(true)
                imageUrl = await uploadImageToImgBB(imageFile)
                setUploading(false)
            }

            const productData = {
                name: form.name?.trim(),
                price: form.price,
                description: form.description?.trim(),
                imageUrl,
                categoryId: form.categoryId,
                category: categories.find(c => c.categoryId === form.categoryId)?.name ?? '',
                // нові поля
                isBestSeller: !!form.isBestSeller,
                glassType: form.glassType?.trim() || '',
                material: form.material?.trim() || '',
                airSupply: form.airSupply?.trim() || '',
                dimensions: form.dimensions?.trim() || '',
                chimneyDiameter: form.chimneyDiameter?.trim() || '',
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
            imageUrl: p.imageUrl,
            categoryId: p.categoryId,
            isBestSeller: !!p.isBestSeller,
            glassType: p.glassType || '',
            material: p.material || '',
            airSupply: p.airSupply || '',
            dimensions: p.dimensions || '',
            chimneyDiameter: p.chimneyDiameter || '',
        })
        setImageFile(null)
        setImagePreview('')
        setActiveTab('products')
    }

    const reset = () => {
        setForm(empty)
        setImageFile(null)
        setImagePreview('')
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

    return (
        <div style={{ padding: 20 }}>
            {/* ТАБУЛЯЦІЯ */}
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 20,
                    borderBottom: '1px solid #eee',
                    paddingBottom: 12,
                }}
            >
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        padding: '8px 16px',
                        background: activeTab === 'products' ? '#ff6b35' : '#e0e0e0',
                        color: activeTab === 'products' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    📦 Товари ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    style={{
                        padding: '8px 16px',
                        background: activeTab === 'categories' ? '#ff6b35' : '#e0e0e0',
                        color: activeTab === 'categories' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    🏷️ Категорії ({categories.length})
                </button>
            </div>

            {/* ПОВІДОМЛЕННЯ */}
            {error && (
                <div
                    style={{
                        background: '#ffe6e6',
                        color: '#e74c3c',
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                    }}
                >
                    ⚠️ {error}
                </div>
            )}
            {successMsg && (
                <div
                    style={{
                        background: '#e6ffe6',
                        color: '#27ae60',
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                    }}
                >
                    {successMsg}
                </div>
            )}

            {/* ТАБ: ТОВАРИ */}
            {activeTab === 'products' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Карточка: Основна інформація */}
                    <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                        <h3>Основна інформація</h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Назва товару*
                                </label>
                                <input
                                    type='text'
                                    placeholder='Напр., Камінна топка Optima 700'
                                    value={form.name || ''}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Ціна (₴)*
                                </label>
                                <input
                                    type='number'
                                    placeholder='Напр., 18999'
                                    value={form.price || 0}
                                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Категорія*
                                </label>
                                <select
                                    value={form.categoryId || ''}
                                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                >
                                    <option value=''>Оберіть категорію...</option>
                                    {categories.map(c => (
                                        <option key={c.categoryId} value={c.categoryId}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Фото товару* (JPG, PNG, WebP, GIF)
                                </label>
                                <input
                                    type='file'
                                    accept='image/jpeg,image/png,image/webp,image/gif'
                                    onChange={handleImageSelect}
                                    disabled={uploading || saving}
                                    style={{ width: '100%', padding: 8 }}
                                />
                                {imagePreview && (
                                    <div style={{ marginTop: 12 }}>
                                        <img
                                            src={imagePreview}
                                            alt='Preview'
                                            style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 6, border: '2px solid #ff6b35' }}
                                        />
                                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>📤 Готово до завантаження</div>
                                    </div>
                                )}
                                {form.imageUrl && !imagePreview && (
                                    <div style={{ fontSize: 12, color: '#27ae60', marginTop: 4 }}>✓ Зображення вже завантажено</div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Опис
                                </label>
                                <textarea
                                    placeholder='Короткий опис особливостей та переваг...'
                                    value={form.description || ''}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={4}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button
                                onClick={save}
                                disabled={saving || uploading}
                                style={{ flex: 1, padding: 12, background: '#ff6b35', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600 }}
                            >
                                {uploading ? '📤 Завантаження фото...' : saving ? '💾 Збереження...' : form.id ? '✏️ Оновити' : '➕ Додати'}
                            </button>
                            {form.id && (
                                <button
                                    onClick={reset}
                                    disabled={saving}
                                    style={{ padding: 12, background: '#e0e0e0', border: 'none', borderRadius: 6, fontWeight: 600 }}
                                >
                                    ✕ Скасувати
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Карточка: Технічні характеристики */}
                    <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                        <h3>Технічні характеристики</h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                                <input
                                    type='checkbox'
                                    checked={!!form.isBestSeller}
                                    onChange={e => setForm(f => ({ ...f, isBestSeller: e.target.checked }))}
                                />
                                Хіт продажу
                            </label>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Форма скла
                                </label>
                                <input
                                    type='text'
                                    placeholder='Напр., Пряме / Кутове / П-подібне'
                                    value={form.glassType || ''}
                                    onChange={e => setForm(f => ({ ...f, glassType: e.target.value }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Матеріал виготовлення
                                </label>
                                <input
                                    type='text'
                                    placeholder='Напр., Сталь / Чавун'
                                    value={form.material || ''}
                                    onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Підведення повітря
                                </label>
                                <input
                                    type='text'
                                    placeholder='Напр., Зовнішнє / Примусове'
                                    value={form.airSupply || ''}
                                    onChange={e => setForm(f => ({ ...f, airSupply: e.target.value }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Розміри та форма
                                </label>
                                <input
                                    type='text'
                                    placeholder='Напр., 700×450 мм, кутова'
                                    value={form.dimensions || ''}
                                    onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Діаметр димоходу
                                </label>
                                <input
                                    type='text'
                                    placeholder='Напр., 180 мм'
                                    value={form.chimneyDiameter || ''}
                                    onChange={e => setForm(f => ({ ...f, chimneyDiameter: e.target.value }))}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* СПИСОК ТОВАРІВ З ФІЛЬТРУВАННЯМ (без змін логіки) */}
                    <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3>📦 Товари</h3>

                        {/* ФІЛЬТР */}
                        <div style={{ marginBottom: 16 }}>
                            <button
                                onClick={() => setSelectedCategoryId(null)}
                                style={{
                                    padding: '6px 12px',
                                    background: selectedCategoryId === null ? '#ff6b35' : '#e0e0e0',
                                    color: selectedCategoryId === null ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    marginBottom: 8,
                                    marginRight: 8,
                                }}
                            >
                                Всі ({products.length})
                            </button>
                            {categories.map(c => (
                                <button
                                    key={c.categoryId}
                                    onClick={() => setSelectedCategoryId(c.categoryId)}
                                    style={{
                                        padding: '6px 12px',
                                        background:
                                            selectedCategoryId === c.categoryId
                                                ? '#ff6b35'
                                                : '#e0e0e0',
                                        color:
                                            selectedCategoryId === c.categoryId ? 'white' : '#333',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        marginBottom: 8,
                                        marginRight: 8,
                                    }}
                                >
                                    {c.name} ({productsByCategory[c.categoryId]?.length ?? 0})
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            {filteredProducts.length === 0 ? (
                                <p style={{ color: '#999' }}>Товарів нема</p>
                            ) : (
                                filteredProducts.map(p => (
                                    <div
                                        key={p.id}
                                        style={{
                                            background: 'white',
                                            padding: 12,
                                            borderRadius: 6,
                                            border: '1px solid #eee',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 12,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            {p.imageUrl && (
                                                <img
                                                    src={p.imageUrl}
                                                    alt={p.name}
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        objectFit: 'cover',
                                                        borderRadius: 4,
                                                    }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 4px 0' }}>{p.name}</h4>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 12,
                                                        color: '#666',
                                                    }}
                                                >
                                                    {p.category} · <b>{p.price} ₴</b>
                                                </p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: 12 }}>
                                                    {p.description?.substring(0, 60)}...
                                                </p>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 6,
                                                }}
                                            >
                                                <button
                                                    onClick={() => edit(p)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#ff6b35',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    ✏️ Редагувати
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(p.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#e74c3c',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                    }}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* ФОРМА КАТЕГОРІЇ */}
                    <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                        <h3>
                            {categoryForm.id ? '✏️ Редагувати категорію' : '➕ Додати категорію'}
                        </h3>

                        <div style={{ display: 'grid', gap: 12 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                                    Назва категорії*
                                </label>
                                <input
                                    type='text'
                                    placeholder='Назва категорії...'
                                    value={categoryForm.name || ''}
                                    onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: 10,
                                        border: '1px solid #ddd',
                                        borderRadius: 6,
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={saveCategory}
                                    disabled={saving}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        background: '#ff6b35',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        opacity: saving ? 0.6 : 1,
                                    }}
                                >
                                    {saving ? '💾 Збереження...' : categoryForm.id ? '✏️ Оновити' : '➕ Додати'}
                                </button>

                                {categoryForm.id && (
                                    <button
                                        onClick={resetCategory}
                                        disabled={saving}
                                        style={{
                                            padding: 12,
                                            background: '#e0e0e0',
                                            border: 'none',
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ✕ Скасувати
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* СПИСОК КАТЕГОРІЙ */}
                    <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3>🏷️ Категорії ({categories.length})</h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {categories.length === 0 ? (
                                <p style={{ color: '#999' }}>Категорій нема</p>
                            ) : (
                                categories.map(c => (
                                    <div
                                        key={c.categoryId}
                                        style={{
                                            background: 'white',
                                            padding: 12,
                                            borderRadius: 6,
                                            border: '1px solid #eee',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div>
                                            <h4 style={{ margin: 0 }}>{c.name}</h4>
                                            <p
                                                style={{
                                                    margin: '4px 0 0 0',
                                                    fontSize: 12,
                                                    color: '#666',
                                                }}
                                            >
                                                {productsByCategory[c.categoryId]?.length ?? 0}{' '}
                                                товарів
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => editCategory(c)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#ff6b35',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                }}
                                            >
                                                ✏️ Редагувати
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(c.categoryId)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#e74c3c',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                }}
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
