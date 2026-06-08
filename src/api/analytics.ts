import { API_URL_PLATFORMS, API_KEY } from "../config"
import { bringApiFetch } from "./bringApiFetch"

interface Body {
    type: string
    platform: string
    userId?: string
    walletAddress?: string
    category?: string
    action?: string
    process?: string
    details?: unknown
    retailer?: string
    flowId: string
    timestamp?: number
}

const analytics = async (body: Body) => {
    body.timestamp = Date.now()

    try {
        const res = await bringApiFetch(`${API_URL_PLATFORMS}analytics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(body)
        })

        if (!res.ok) {
            throw new Error(`Failed to send analytics (${res.status})`)
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('BRING: Error sending analytics event', error)
        return null
    }
}

export default analytics;
