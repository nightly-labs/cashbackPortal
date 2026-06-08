import { API_URL_PLATFORMS, API_KEY } from "../../config"
import { bringApiFetch } from "../bringApiFetch"

interface Body extends BackendRequestBody {
    walletAddress: string | null
    targetWalletAddress: string | null
    tokenSymbol: string
    tokenAmount: number
    signature: string
    key?: string
    message: string
    platform: string
}

const claimSubmit = async (body: Body) => {
    if (!body.walletAddress || !body.targetWalletAddress) return { status: 400 }

    try {
        const res = await bringApiFetch(`${API_URL_PLATFORMS}claim-submit`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to submit claim (${res.status})`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('BRING: Failed to submit claim', error)
        return { status: 500 }
    }
}

export default claimSubmit
