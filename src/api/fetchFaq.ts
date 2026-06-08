import { API_URL_PLATFORMS, API_KEY } from "../config"
import { bringApiFetch } from "./bringApiFetch"

interface Body extends BackendRequestBody {
    walletAddress: string | undefined
    platform: string
}

interface Link {
    href: string,
    linkText: string
}

interface Faq {
    id: string
    itemOrder: number
    question: string
    answer: string[]
    links?: Link[]
}

interface Response {
    faq: Faq[]
    indentationMark: string
    status: number
}

const fetchFaq = async (body: Body): Promise<Response> => {

    if (!body.walletAddress) {
        body.walletAddress = 'null'
    }

    try {
        const res = await bringApiFetch(`${API_URL_PLATFORMS}faq`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch FAQ (${res.status})`)
        }

        const data = await res.json()
        return data
    } catch (error) {
        console.error('BRING: Failed to fetch FAQ', error)
        return {
            faq: [],
            indentationMark: '',
            status: 500
        }
    }
}

export default fetchFaq
