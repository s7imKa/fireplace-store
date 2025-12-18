import type { Dispatch, FC, SetStateAction } from 'react'
import './AsideFilter.scss'

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

type Props = {
    filters: FiltersState
    setFilters: Dispatch<SetStateAction<FiltersState>>
    options: {
        airSupply: string[]
        material: string[]
        glassType: string[]
        dimensions: string[]
        chimneyDiameter: string[]
    }
    onReset: () => void
}

const AsideFilter: FC<Props> = ({ filters, setFilters, options, onReset }) => {
    const showAirSupply = options.airSupply.length > 0
    const showMaterial = options.material.length > 0
    const showGlassType = options.glassType.length > 0
    const showDimensions = options.dimensions.length > 0
    const showChimneyDiameter = options.chimneyDiameter.length > 0

    return (
        <aside className='aside-filter'>
            <div className='aside-filter__card'>
                <div className='aside-filter__header'>
                    <h3>Фільтри</h3>
                    <button className='aside-filter__reset' type='button' onClick={onReset}>
                        Скинути
                    </button>
                </div>

                <div className='aside-filter__group'>
                    <label className='aside-filter__label'>Ціна</label>
                    <div className='aside-filter__row'>
                        <input
                            className='aside-filter__input'
                            type='number'
                            placeholder='Від'
                            value={filters.minPrice}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, minPrice: e.target.value }))
                            }
                            min={0}
                        />
                        <input
                            className='aside-filter__input'
                            type='number'
                            placeholder='До'
                            value={filters.maxPrice}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, maxPrice: e.target.value }))
                            }
                            min={0}
                        />
                    </div>
                </div>

                <div className='aside-filter__group'>
                    <label className='aside-filter__checkbox'>
                        <input
                            type='checkbox'
                            checked={filters.bestSellerOnly}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, bestSellerOnly: e.target.checked }))
                            }
                        />
                        Тільки хіти продажу
                    </label>

                    <label className='aside-filter__checkbox'>
                        <input
                            type='checkbox'
                            checked={filters.hasImageOnly}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, hasImageOnly: e.target.checked }))
                            }
                        />
                        Тільки з фото
                    </label>
                </div>

                {showAirSupply && (
                    <div className='aside-filter__group'>
                        <label className='aside-filter__label'>Подача повітря </label>
                        <select
                            className='aside-filter__select'
                            value={filters.airSupply}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, airSupply: e.target.value }))
                            }
                        >
                            <option value=''>Будь-яка</option>
                            {options.airSupply.map(v => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showMaterial && (
                    <div className='aside-filter__group'>
                        <label className='aside-filter__label'>Матеріал </label>
                        <select
                            className='aside-filter__select'
                            value={filters.material}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, material: e.target.value }))
                            }
                        >
                            <option value=''>Будь-який</option>
                            {options.material.map(v => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showGlassType && (
                    <div className='aside-filter__group'>
                        <label className='aside-filter__label'>Тип скла </label>
                        <select
                            className='aside-filter__select'
                            value={filters.glassType}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, glassType: e.target.value }))
                            }
                        >
                            <option value=''>Будь-який</option>
                            {options.glassType.map(v => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showDimensions && (
                    <div className='aside-filter__group'>
                        <label className='aside-filter__label'>Розміри </label>
                        <select
                            className='aside-filter__select'
                            value={filters.dimensions}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, dimensions: e.target.value }))
                            }
                        >
                            <option value=''>Будь-які</option>
                            {options.dimensions.map(v => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showChimneyDiameter && (
                    <div className='aside-filter__group'>
                        <label className='aside-filter__label'>
                            Діаметр димоходу 
                        </label>
                        <select
                            className='aside-filter__select'
                            value={filters.chimneyDiameter}
                            onChange={e =>
                                setFilters(prev => ({ ...prev, chimneyDiameter: e.target.value }))
                            }
                        >
                            <option value=''>Будь-який</option>
                            {options.chimneyDiameter.map(v => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </aside>
    )
}

export default AsideFilter
