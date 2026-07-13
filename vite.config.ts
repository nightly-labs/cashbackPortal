import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const bringProxyCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
}

type BringProxy = {
  on: {
    (event: 'proxyReq', callback: (proxyReq: { setHeader: (name: string, value: string) => void }) => void): void
    (event: 'proxyRes', callback: (proxyRes: { headers: Record<string, string | string[] | undefined> }) => void): void
  }
}

const bringProxyCorsPlugin = () => ({
  name: 'bring-proxy-cors',
  configureServer(server: { middlewares: { use: (path: string, middleware: (req: { method?: string }, res: { setHeader: (name: string, value: string) => void, statusCode: number, end: () => void }, next: () => void) => void) => void } }) {
    server.middlewares.use('/bring-api', (req, res, next) => {
      Object.entries(bringProxyCorsHeaders).forEach(([name, value]) => {
        res.setHeader(name, value)
      })

      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      next()
    })
  },
})

const extractApiKeyFromBundle = (js: string): string | null => {
  const literalApiKey = js.match(/["']x-api-key["']\s*:\s*["']([^"']+)["']/)?.[1]
  if (literalApiKey) return literalApiKey

  const apiKeyVariable = js.match(/["']x-api-key["']\s*:\s*([A-Za-z_$][\w$]*)/)?.[1]
  if (!apiKeyVariable) return null

  const escapedVariable = apiKeyVariable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return js.match(new RegExp(`(?:^|[,;])\\s*${escapedVariable}\\s*=\\s*["']([^"']+)["']`))?.[1] ?? null
}

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
    return extractApiKeyFromBundle(js)
  } catch {
    return null
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const hostedPortalApiKey = await getHostedPortalApiKey(mode)

  return {
    plugins: [bringProxyCorsPlugin(), react()],
    server: {
      cors: true,
      proxy: {
        '/bring-api': {
          target: 'https://api.bringweb3.io',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/bring-api/, ''),
          configure: (proxy: BringProxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', 'https://portal.bringweb3.io')
              proxyReq.setHeader('referer', 'https://portal.bringweb3.io/')
              if (hostedPortalApiKey) {
                proxyReq.setHeader('x-api-key', hostedPortalApiKey)
              }
            })
            proxy.on('proxyRes', (proxyRes: { headers: Record<string, string | string[] | undefined> }) => {
              Object.entries(bringProxyCorsHeaders).forEach(([name, value]) => {
                proxyRes.headers[name] = value
              })
            })
          },
        },
      },
    },
  }
})
