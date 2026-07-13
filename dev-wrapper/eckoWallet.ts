/**
 * Ecko Wallet (Kadena) adapter — connect only.
 *
 * Provider surface used (injected by the Ecko extension as `window.kadena`):
 *   await window.kadena.request({ method: 'kda_connect', networkId })
 *     -> { status: 'success' | 'fail', account?: { account: string, publicKey: string } }
 *   await window.kadena.request({ method: 'kda_checkStatus', networkId })
 *     -> { status, account? }
 *   await window.kadena.request({ method: 'kda_disconnect', networkId })
 *
 * Signing is intentionally not implemented; this adapter only proves
 * connectivity for the dev wrapper. Calling signMessage throws a clear
 * error so the operator notices.
 */

import type { MockWallet, SignResult } from './mockWallet'

interface KadenaProvider {
    isKadena?: boolean
    request(args: { method: string; networkId?: string; data?: unknown }): Promise<{
        status: 'success' | 'fail'
        message?: string
        account?: { account: string; publicKey?: string; chainId?: string | number }
        wallet?: { account: string; publicKey?: string }
    }>
}

declare global {
    interface Window {
        kadena?: KadenaProvider
    }
}

export interface EckoWalletOptions {
    /**
     * Network the dApp targets (`mainnet01`, `testnet04`, …). Ecko returns
     * `fail` if a different network is currently selected in the wallet.
     */
    networkId?: string
}

export function createEckoWallet(opts: EckoWalletOptions = {}): MockWallet {
    const networkId = opts.networkId ?? 'mainnet01'

    const getProvider = (): KadenaProvider => {
        const p = window.kadena
        if (!p) {
            throw new Error('Ecko wallet not detected. Install the eckoWALLET extension and reload.')
        }
        return p
    }

    let address: string | null = null

    return {
        getAddress: () => address,

        async connect() {
            const provider = getProvider()
            const res = await provider.request({ method: 'kda_connect', networkId })
            if (res.status !== 'success' || !res.account?.account) {
                throw new Error(res.message || 'Ecko connect was rejected')
            }
            address = res.account.account
            return address
        },

        async disconnect() {
            const provider = window.kadena
            try {
                await provider?.request({ method: 'kda_disconnect', networkId })
            } catch {
                /* ignore — wallet may already be disconnected */
            } finally {
                address = null
            }
        },

        async signMessage(): Promise<SignResult> {
            throw new Error('Ecko adapter is connect-only in the dev wrapper; signMessage is not implemented.')
        },
    }
}
