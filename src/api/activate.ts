import { API_KEY, API_URL_PLATFORMS } from "../config"
import { bringApiFetch } from "./bringApiFetch"

interface Body extends BackendRequestBody {
    itemId: string
    walletAddress: string
    tokenSymbol: string
    search?: string
    platform: string
    isDemo?: boolean
}

interface Response {
    url: string
    cashbackInfoUrl: string | null
    iframeUrl: string
    token: string
    domain: string
}

const activate = async (body: Body): Promise<Response> => {
    try {
        const res = await bringApiFetch(`${API_URL_PLATFORMS}activate`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to activate retailer (${res.status})`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('BRING: Failed to activate retailer', error)
        return {
            url: '',
            cashbackInfoUrl: null,
            iframeUrl: '',
            token: '',
            domain: ''
        }
    }
}

export default activate
