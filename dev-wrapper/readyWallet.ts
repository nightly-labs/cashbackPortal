/**
 * Ready / Argent X (Starknet) adapter — connect only.
 *
 * Argent rebranded to "Ready" but the browser extension still injects the
 * Starknet provider as `window.starknet_argentX` (or generic `window.starknet`
 * when Argent is the only / preferred wallet).
 *
 * Provider surface used (Starknet wallet standard):
 *   await provider.enable()                    -> string[] (selected addresses)
 *   provider.selectedAddress / provider.account.address
 *   await provider.request?({ type: 'wallet_disconnect' })
 *
 * Signing is intentionally not implemented; this adapter only proves
 * connectivity for the dev wrapper.
 */

import type { MockWallet, SignResult } from './mockWallet'

interface StarknetProvider {
    id?: string
    name?: string
    isConnected?: boolean
    selectedAddress?: string | null
    account?: { address?: string }
    enable(opts?: { starknetVersion?: 'v4' | 'v5' }): Promise<string[]>
    request?(args: { type: string; params?: unknown }): Promise<unknown>
}

declare global {
    interface Window {
        starknet?: StarknetProvider
        starknet_argentX?: StarknetProvider
        starknet_ready?: StarknetProvider
    }
}

export function createReadyWallet(): MockWallet {
    const getProvider = (): StarknetProvider => {
        // Prefer the explicitly-namespaced Argent/Ready provider; fall back
        // to the generic `window.starknet` if that's all that's injected.
        const p = window.starknet_ready ?? window.starknet_argentX ?? window.starknet
        if (!p) {
            throw new Error('Ready (Argent) wallet not detected. Install the Ready extension and reload.')
        }
        return p
    }

    let address: string | null = null

    const readAddress = (provider: StarknetProvider, fromEnable: string[] | undefined): string => {
        const addr =
            fromEnable?.[0] ??
            provider.selectedAddress ??
            provider.account?.address ??
            null
        if (!addr) throw new Error('Ready returned no address')
        return addr
    }

    return {
        getAddress: () => address,

        async connect() {
            const provider = getProvider()
            const accounts = await provider.enable({ starknetVersion: 'v5' })
            address = readAddress(provider, accounts)
            return address
        },

        async disconnect() {
            const provider = window.starknet_ready ?? window.starknet_argentX ?? window.starknet
            try {
                await provider?.request?.({ type: 'wallet_disconnect' })
            } catch {
                /* ignore — many builds don't implement programmatic disconnect */
            } finally {
                address = null
            }
        },

        async signMessage(): Promise<SignResult> {
            throw new Error('Ready adapter is connect-only in the dev wrapper; signMessage is not implemented.')
        },
    }
}
