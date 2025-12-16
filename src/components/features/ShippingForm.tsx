import { useEffect, useRef, useState } from 'react'
import { getWarehouses, searchCities, type City, type Warehouse } from '../../hooks/npApi'
import { saveShippingInfo } from '../../hooks/useOrders'
import type { ShippingInfo } from '../../types/order.type'
import './ShippingForm.scss'
import { useNavigate } from 'react-router'

interface Props {
    orderId: string
    onDone: () => void
}

const PHONE_REGEX = /^\+?380\d{9}$/

type FormState = ShippingInfo

interface FormErrors {
    [key: string]: string | null
}

export default function ShippingForm({ orderId, onDone }: Props) {
    const [form, setForm] = useState<FormState>({
        firstName: '',
        lastName: '',
        phone: '',
        city: '',
        novaPoshtaBranch: '',
        comment: '',
    })

    const [errors, setErrors] = useState<FormErrors>({})
    const [cities, setCities] = useState<City[]>([])
    const [cityRef, setCityRef] = useState<string | null>(null)
    const [cityLoading, setCityLoading] = useState(false)
    const [showCityDropdown, setShowCityDropdown] = useState(false)

    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [warehouseLoading, setWarehouseLoading] = useState(false)
    const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false)

    const [saving, setSaving] = useState(false)
    const [globalError, setGlobalError] = useState<string | null>(null)

    const debounceTimer = useRef<number | undefined>(undefined)
    const cityInputRef = useRef<HTMLInputElement | null>(null)
    const warehouseInputRef = useRef<HTMLInputElement | null>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const navigate = useNavigate()

    // Закриття dropdown при кліку поза ним
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (!overlayRef.current?.contains(target)) {
                setShowCityDropdown(false)
                setShowWarehouseDropdown(false)
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowCityDropdown(false)
                setShowWarehouseDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    // Пошук міст з debounce
    useEffect(() => {
        if (!form.city.trim()) {
            setCities([])
            return
        }

        window.clearTimeout(debounceTimer.current)
        setCityLoading(true)

        debounceTimer.current = window.setTimeout(async () => {
            try {
                const results = await searchCities(form.city)
                setCities(results)
                setShowCityDropdown(true)
            } catch (e) {
                console.error('Search cities error:', e)
                setCities([])
            } finally {
                setCityLoading(false)
            }
        }, 300)
    }, [form.city])

    // Завантаження складів при виборі міста
    useEffect(() => {
        if (!cityRef) {
            setWarehouses([])
            return
        }

        const loadWarehouses = async () => {
            setWarehouseLoading(true)
            try {
                const results = await getWarehouses(cityRef)
                setWarehouses(results)
            } catch (e) {
                console.error('Get warehouses error:', e)
                setWarehouses([])
            } finally {
                setWarehouseLoading(false)
            }
        }

        loadWarehouses()
    }, [cityRef])

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        // Очистити помилку поля при редагуванні
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const selectCity = (city: City) => {
        setForm(prev => ({
            ...prev,
            city: city.Present,
            novaPoshtaBranch: '',
        }))
        setCityRef(city.DeliveryCity)
        setShowCityDropdown(false)
        setErrors(prev => ({ ...prev, city: null }))
        // Фокус на поле доставки
        setTimeout(() => warehouseInputRef.current?.focus(), 0)
    }

    const selectWarehouse = (warehouse: Warehouse) => {
        setForm(prev => ({
            ...prev,
            novaPoshtaBranch: warehouse.Description,
        }))
        setShowWarehouseDropdown(false)
        setErrors(prev => ({ ...prev, novaPoshtaBranch: null }))
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!form.lastName.trim()) {
            newErrors.lastName = 'Вкажіть прізвище'
        }
        if (!form.firstName.trim()) {
            newErrors.firstName = 'Вкажіть імʼя'
        }
        if (!form.phone.trim()) {
            newErrors.phone = 'Вкажіть телефон'
        } else if (!PHONE_REGEX.test(form.phone.trim())) {
            newErrors.phone = 'Формат: +380XXXXXXXXX'
        }
        if (!form.city.trim()) {
            newErrors.city = 'Оберіть місто зі списку'
        }
        if (!cityRef) {
            newErrors.city = 'Оберіть місто зі списку'
        }
        if (!form.novaPoshtaBranch.trim()) {
            newErrors.novaPoshtaBranch = 'Оберіть відділення доставки'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setGlobalError(null)

        if (!validateForm()) {
            return
        }

        setSaving(true)
        try {
            await saveShippingInfo(orderId, {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phone: form.phone.trim(),
                city: form.city.trim(),
                novaPoshtaBranch: form.novaPoshtaBranch.trim(),
                comment: form.comment?.trim() || '',
            })
            onDone()
            navigate('/')
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Помилка збереження даних'
            setGlobalError(errorMsg)
            console.error('Save shipping error:', e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className='shipping-modal' ref={overlayRef}>
            <form className='shipping-form' onSubmit={handleSubmit} noValidate>
                <h2>📍 Доставка замовлення</h2>

                {globalError && (
                    <div
                        style={{
                            padding: '12px',
                            background: '#ffe6e6',
                            borderRadius: '6px',
                            marginBottom: '16px',
                            color: '#e74c3c',
                        }}
                    >
                        {globalError}
                    </div>
                )}

                {/* Прізвище */}
                <div className='form-group'>
                    <label htmlFor='lastName'>
                        Прізвище
                        <span className='required'>*</span>
                    </label>
                    <input
                        id='lastName'
                        name='lastName'
                        type='text'
                        placeholder='Іванов'
                        value={form.lastName}
                        onChange={handleFieldChange}
                        aria-invalid={!!errors.lastName}
                        autoComplete='family-name'
                    />
                    {errors.lastName && <div className='error-message'>{errors.lastName}</div>}
                </div>

                {/* Імʼя */}
                <div className='form-group'>
                    <label htmlFor='firstName'>
                        Імʼя
                        <span className='required'>*</span>
                    </label>
                    <input
                        id='firstName'
                        name='firstName'
                        type='text'
                        placeholder='Іван'
                        value={form.firstName}
                        onChange={handleFieldChange}
                        aria-invalid={!!errors.firstName}
                        autoComplete='given-name'
                    />
                    {errors.firstName && <div className='error-message'>{errors.firstName}</div>}
                </div>

                {/* Телефон */}
                <div className='form-group'>
                    <label htmlFor='phone'>
                        Телефон
                        <span className='required'>*</span>
                    </label>
                    <input
                        id='phone'
                        name='phone'
                        type='tel'
                        placeholder='+380123456789'
                        value={form.phone}
                        onChange={handleFieldChange}
                        aria-invalid={!!errors.phone}
                        autoComplete='tel'
                        inputMode='tel'
                    />
                    {errors.phone && <div className='error-message'>{errors.phone}</div>}
                </div>

                {/* Місто */}
                <div className='form-group'>
                    <label htmlFor='city'>
                        Місто
                        <span className='required'>*</span>
                    </label>
                    <div className='dropdown-container'>
                        <input
                            id='city'
                            name='city'
                            ref={cityInputRef}
                            type='text'
                            placeholder='Почніть вводити назву міста...'
                            value={form.city}
                            onChange={handleFieldChange}
                            onFocus={() => {
                                if (cities.length > 0) setShowCityDropdown(true)
                            }}
                            aria-invalid={!!errors.city}
                            autoComplete='off'
                        />
                        {showCityDropdown && cities.length > 0 && (
                            <div className='dropdown-list'>
                                {cities.map(city => (
                                    <div
                                        key={city.Ref}
                                        className='dropdown-item'
                                        onClick={() => selectCity(city)}
                                    >
                                        {city.Present}
                                    </div>
                                ))}
                            </div>
                        )}
                        {cityLoading && <div className='loading'>Пошук міст...</div>}
                    </div>
                    {errors.city && <div className='error-message'>{errors.city}</div>}
                </div>

                {/* Відділення доставки */}
                {cityRef && (
                    <div className='form-group'>
                        <label htmlFor='warehouse'>
                            Відділення доставки
                            <span className='required'>*</span>
                        </label>
                        <div className='dropdown-container'>
                            <input
                                id='warehouse'
                                name='novaPoshtaBranch'
                                ref={warehouseInputRef}
                                type='text'
                                placeholder='Оберіть відділення Нової Пошти...'
                                value={form.novaPoshtaBranch}
                                onChange={handleFieldChange}
                                onFocus={() => {
                                    if (warehouses.length > 0) setShowWarehouseDropdown(true)
                                }}
                                aria-invalid={!!errors.novaPoshtaBranch}
                                autoComplete='off'
                            />
                            {showWarehouseDropdown && warehouses.length > 0 && (
                                <div className='dropdown-list'>
                                    {warehouses.map(warehouse => (
                                        <div
                                            key={warehouse.Ref}
                                            className='dropdown-item'
                                            onClick={() => selectWarehouse(warehouse)}
                                        >
                                            {warehouse.Description}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {warehouseLoading && (
                                <div className='loading'>Завантаження відділень...</div>
                            )}
                        </div>
                        {errors.novaPoshtaBranch && (
                            <div className='error-message'>{errors.novaPoshtaBranch}</div>
                        )}
                    </div>
                )}

                {/* Коментар */}
                <div className='form-group'>
                    <label htmlFor='comment'>Коментар до замовлення</label>
                    <textarea
                        id='comment'
                        name='comment'
                        placeholder='Додаткова інформація для доставки...'
                        value={form.comment}
                        onChange={handleFieldChange}
                    />
                </div>

                {/* Кнопки */}
                <div className='form-actions'>
                    <button type='submit' className='btn-primary' disabled={saving}>
                        {saving ? 'Обробка...' : '✓ Оформити замовлення'}
                    </button>
                    <button
                        type='button'
                        className='btn-secondary'
                        onClick={onDone}
                        disabled={saving}
                    >
                        Скасувати
                    </button>
                </div>
            </form>
        </div>
    )
}
