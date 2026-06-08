import { API_URL_PLATFORMS, API_KEY } from "../../config"
import { bringApiFetch } from "../bringApiFetch"

interface Body extends BackendRequestBody {
    walletAddress: string | null
    targetWalletAddress: string | null
    tokenSymbol: string
    tokenAmount: number
    platform: string
}

interface Response {
    messageToSign: string
    status?: number
}

const claimInitiate = async (body: Body): Promise<Response> => {
    if (!body.walletAddress || !body.targetWalletAddress) {
        return { messageToSign: "", status: 400 }
    }

    try {
        const res = await bringApiFetch(`${API_URL_PLATFORMS}claim-init`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to initiate claim (${res.status})`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('BRING: Failed to initiate claim', error)
        return { messageToSign: "", status: 500 }
    }
}

export default claimInitiate
