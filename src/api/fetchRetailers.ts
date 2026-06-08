import { API_KEY, API_URL_PLATFORMS } from "../config"
import { bringApiFetch } from "./bringApiFetch"

interface Body extends BackendRequestBody {
    type: string
    country?: string
    search?: string
    category?: number
    page?: number
    pageSize?: number
    platform: string
}

interface Response {
    topGeneralTermsUrl: string
    generalTermsUrl: string
    items: Retailer[]
    nextPageNumber: number | null
    prevPageNumber: number | null
    retailerIconBasePath: string
    retailerTermsBasePath: string
    totalItems: number
    iconQueryParam: string
    campaigns: number[]
}

const fetchRetailers = async (body: Body): Promise<Response> => {
    try {
        const res = await bringApiFetch(`${API_URL_PLATFORMS}retailers`, {
            method: "POST",
            body: JSON.stringify(body),
            mode: "cors",
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch retailers (${res.status})`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('BRING: Failed to fetch retailers', error)
        return {
            topGeneralTermsUrl: '',
            generalTermsUrl: '',
            items: [],
            nextPageNumber: null,
            prevPageNumber: null,
            retailerIconBasePath: '',
            retailerTermsBasePath: '',
            totalItems: 0,
            iconQueryParam: '',
            campaigns: []
        }
    }
}

export default fetchRetailers
