import type {} from 'react'

const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/'
const API_KEY = import.meta.env.VITE_NP_API_KEY

interface NPEnvelope<T> {
    success: boolean
    data: T[]
    errors: string[]
    warnings: string[]
}

async function npCall<TProps, TResp>(
    modelName: string,
    calledMethod: string,
    methodProperties: TProps,
): Promise<TResp[]> {
    if (!API_KEY) throw new Error('Nova Poshta API key missing')
    const res = await fetch(NP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: API_KEY, modelName, calledMethod, methodProperties }),
    })
    const json: NPEnvelope<TResp> = await res.json()
    if (!json.success) throw new Error(json.errors?.[0] || 'Nova Poshta API error')
    return json.data
}

export interface City {
    Ref: string
    Present: string
    DeliveryCity: string // ЦЕ і є CityRef для getWarehouses
}

export interface Warehouse {
    Ref: string
    Description: string
}

export async function searchCities(query: string) {
    if (!query.trim()) return []
    const raw = await npCall<{ CityName: string; Limit: number }, any>(
        'Address',
        'searchSettlements',
        { CityName: query, Limit: 25 },
    )
    const out: City[] = []
    raw.forEach((g: any) => {
        ;(g.Addresses || []).forEach((c: any) => {
            out.push({
                Ref: c.Ref,
                Present: c.Present,
                DeliveryCity: c.DeliveryCity, // потрібне для складів
            })
        })
    })
    return out
}

export async function getWarehouses(cityRef: string) {
    return npCall<{ CityRef: string }, Warehouse>('Address', 'getWarehouses', { CityRef: cityRef })
}
