import { API_URL_PORTAL, API_KEY } from "../config"
import { bringApiFetch } from "./bringApiFetch"

interface Body {
    token: string
}

interface Response {
    status: number
    info: {
        isCountryAvailable: boolean
        platform: string
        cryptoSymbols: string[]
        walletAddress: string | null
        userId: string | undefined
        isTester?: boolean
        autoclaim?: boolean
        theme?: string
        terms?: boolean
        extensionId?: string
    }
}

const fetchToken = async (body: Body): Promise<Response> => {
    const res = await bringApiFetch(`${API_URL_PORTAL}verify`, {
        method: "POST",
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body })
    })

    const data = await res.json()

    if (data.info.walletAddress === 'null') {
        data.info.walletAddress = null
    }

    return data
}

export default fetchToken
