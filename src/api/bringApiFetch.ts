import { API_PROXY_PORT_NAME, API_PROXY_SOURCE, API_PROXY_TRANSPORT } from "../config"

type ChromeRuntime = {
    connect?: (connectInfo: { name: string }) => ChromeRuntimePort
    lastError?: {
        message?: string
    }
    sendMessage?: (message: unknown, callback: (response: RuntimeProxyResponse | undefined) => void) => void
}

type ChromeRuntimePort = {
    disconnect: () => void
    onDisconnect: {
        addListener: (callback: () => void) => void
        removeListener: (callback: () => void) => void
    }
    onMessage: {
        addListener: (callback: (message: RuntimeProxyResponse & { requestId?: string }) => void) => void
        removeListener: (callback: (message: RuntimeProxyResponse & { requestId?: string }) => void) => void
    }
    postMessage: (message: unknown) => void
}

type RuntimeProxyResponse = {
    ok?: boolean
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: string
    error?: string
}

const BRING_API_PROXY_MESSAGE_TYPE = 'BRING_API_PROXY'
const EXTENSION_RUNTIME_TRANSPORT = 'extension-runtime'
const PROXY_TIMEOUT_MS = 15000

const getChromeRuntime = (): ChromeRuntime | undefined => {
    const chromeRuntime = (globalThis as typeof globalThis & {
        chrome?: {
            runtime?: ChromeRuntime
        }
    }).chrome?.runtime

    return chromeRuntime?.sendMessage ? chromeRuntime : undefined
}

const serializeRequestBody = (body: BodyInit | null | undefined): BodyInit | null | undefined => {
    if (!body || typeof body === 'string') {
        return body
    }

    if (body instanceof URLSearchParams) {
        return body.toString()
    }

    return body
}

const resolveRequestUrl = (input: RequestInfo | URL): string => {
    if (typeof input === 'string') {
        return input
    }

    if (input instanceof URL) {
        return input.toString()
    }

    return input.url
}

const sendProxyMessage = async (runtime: ChromeRuntime, input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await new Promise<RuntimeProxyResponse | undefined>((resolve, reject) => {
        runtime.sendMessage?.(
            {
                from: API_PROXY_SOURCE,
                type: BRING_API_PROXY_MESSAGE_TYPE,
                request: {
                    body: serializeRequestBody(init?.body),
                    headers: Object.fromEntries(new Headers(init?.headers).entries()),
                    method: init?.method || 'GET',
                    url: resolveRequestUrl(input)
                }
            },
            proxyResponse => {
                const lastError = runtime.lastError

                if (lastError?.message) {
                    reject(new Error(lastError.message))
                    return
                }

                resolve(proxyResponse)
            }
        )
    })

    if (!response) {
        throw new Error('Bring API proxy did not return a response')
    }

    if (response.error) {
        throw new Error(response.error)
    }

    return new Response(response.body || '', {
        headers: response.headers,
        status: response.status || 500,
        statusText: response.statusText || ''
    })
}

const sendProxyPortMessage = async (runtime: ChromeRuntime, input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!runtime.connect) {
        return sendProxyMessage(runtime, input, init)
    }

    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    const response = await new Promise<RuntimeProxyResponse | undefined>((resolve, reject) => {
        const port = runtime.connect?.({ name: API_PROXY_PORT_NAME })

        if (!port) {
            reject(new Error('Bring API proxy port is unavailable'))
            return
        }

        let settled = false
        const cleanup = () => {
            clearTimeout(timeoutId)
            port.onMessage.removeListener(onMessage)
            port.onDisconnect.removeListener(onDisconnect)
        }
        const settle = (callback: () => void) => {
            if (settled) {
                return
            }

            settled = true
            cleanup()
            callback()
            port.disconnect()
        }
        const onMessage = (message: RuntimeProxyResponse & { requestId?: string }) => {
            if (message.requestId !== requestId) {
                return
            }

            settle(() => resolve(message))
        }
        const onDisconnect = () => {
            settle(() => reject(new Error('Bring API proxy port disconnected')))
        }
        const timeoutId = setTimeout(() => {
            settle(() => reject(new Error('Bring API proxy timed out')))
        }, PROXY_TIMEOUT_MS)

        port.onMessage.addListener(onMessage)
        port.onDisconnect.addListener(onDisconnect)
        port.postMessage({
            from: API_PROXY_SOURCE,
            request: {
                body: serializeRequestBody(init?.body),
                headers: Object.fromEntries(new Headers(init?.headers).entries()),
                method: init?.method || 'GET',
                url: resolveRequestUrl(input)
            },
            requestId,
            type: BRING_API_PROXY_MESSAGE_TYPE
        })
    })

    if (!response) {
        throw new Error('Bring API proxy did not return a response')
    }

    if (response.error) {
        throw new Error(response.error)
    }

    return new Response(response.body || '', {
        headers: response.headers,
        status: response.status || 500,
        statusText: response.statusText || ''
    })
}

export const bringApiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const runtime = getChromeRuntime()

    if (API_PROXY_TRANSPORT === EXTENSION_RUNTIME_TRANSPORT && runtime) {
        return sendProxyPortMessage(runtime, input, init)
    }

    return fetch(input, init)
}
