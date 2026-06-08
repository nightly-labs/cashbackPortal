import { API_URL_PLATFORMS, API_KEY } from "../config"
import { bringApiFetch } from "./bringApiFetch"

interface Body extends BackendRequestBody {
    type?: "default" | "aggregated"
    platform: string
}

interface Data {
    eligible: Token[]
    totalPendings: Token[]
    movements: Movements
}

interface Response {
    tokenIconBasePath: string
    retailerIconBasePath: string
    data: Data
}

const fetchCache = async (body: Body): Promise<Response> => {
    body.type = "aggregated"

    try {
        const res = await bringApiFetch(`${API_URL_PLATFORMS}cache`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch cache (${res.status})`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('BRING: Failed to fetch cache', error)
        return {
            tokenIconBasePath: '',
            retailerIconBasePath: '',
            data: {
                eligible: [],
                totalPendings: [],
                movements: {
                    claims: [],
                    deals: []
                }
            }
        }
    }
}

export default fetchCache
