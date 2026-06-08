import { API_URL_PLATFORMS, API_KEY } from "../config"
import { bringApiFetch } from "./bringApiFetch"

interface Options extends BackendRequestParams {
    country?: string
    platform: string
}

interface Response {
    categories: {
        items: {
            id: number
            name: string
            // iconSvg: string
        }[]
    }
    searchTerms: {
        items: string[]
    }
}

const getFilters = async (options: Options): Promise<Response> => {
    try {
        const searchParams: Record<string, string> = {
            user_id: options.user_id,
            platform: options.platform,
            flow_id: options.flow_id,
        }

        if (options.wallet_address) {
            searchParams.wallet_address = options.wallet_address
        }

        if (options.country) {
            searchParams.country = options.country.toUpperCase()
        }

        const params = new URLSearchParams(searchParams)
        const endpoint = `${API_URL_PLATFORMS}categories-search?${params.toString()}`

        const res = await bringApiFetch(endpoint, {
            method: "GET",
            headers: {
                "x-api-key": API_KEY,
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch filters (${res.status})`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('BRING: Failed to fetch filters', error)
        return {
            categories: {
                items: []
            },
            searchTerms: {
                items: []
            }
        }
    }
}

export default getFilters
