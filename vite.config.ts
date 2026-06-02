import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

async function getHostedPortalApiKey(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')
  const bootstrapUrl = env.VITE_LOCAL_PORTAL_BOOTSTRAP_API || 'https://api.bringweb3.io/v1/extension/check/portal'
  const bootstrapApiKey = env.VITE_LOCAL_PORTAL_BOOTSTRAP_API_KEY

  if (!bootstrapApiKey) return null

  try {
    const bootstrapResponse = await fetch(bootstrapUrl, {
      method: 'POST',
      headers: {
        'x-api-key': bootstrapApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: null,
        theme: 'dark',
      }),
    })
    const { portalUrl } = await bootstrapResponse.json() as { portalUrl?: string }
    if (!portalUrl) return null

    const html = await fetch(portalUrl).then((response) => response.text())
    const jsPath = html.match(/src="([^"]+\.js)"/)?.[1]
    if (!jsPath) return null

    const jsUrl = new URL(jsPath, portalUrl).toString()
    const js = await fetch(jsUrl).then((response) => response.text())
    return js.match(/Ki="([^"]+)"/)?.[1] ?? null
  } catch {
    return null
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const hostedPortalApiKey = await getHostedPortalApiKey(mode)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/bring-api': {
          target: 'https://api.bringweb3.io',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/bring-api/, ''),
          configure: (proxy: { on: (event: 'proxyReq', callback: (proxyReq: { setHeader: (name: string, value: string) => void }) => void) => void }) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', 'https://portal.bringweb3.io')
              proxyReq.setHeader('referer', 'https://portal.bringweb3.io/')
              if (hostedPortalApiKey) {
                proxyReq.setHeader('x-api-key', hostedPortalApiKey)
              }
            })
          },
        },
      },
    },
  }
})
