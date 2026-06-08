export const API_KEY = import.meta.env.VITE_API_KEY || ''
export const API_URL_PLATFORMS = `${import.meta.env.VITE_API_URL}platforms/`
export const API_URL_PORTAL = `${import.meta.env.VITE_API_URL}portal/`
export const API_PROXY_TRANSPORT = import.meta.env.VITE_API_PROXY_TRANSPORT || ''
export const API_PROXY_SOURCE = import.meta.env.VITE_API_PROXY_SOURCE || 'bringweb3:portal'
export const API_PROXY_PORT_NAME = import.meta.env.VITE_API_PROXY_PORT_NAME || 'bring-api-proxy'
export const DEV_MODE = import.meta.env.VITE_ENV === 'development'
export const GA_MEASUREMENT_ID = import.meta.env.VITE_ENV_GA_MEASUREMENT_ID || ''
export const ENV = import.meta.env.VITE_ENV || 'development'
export const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
export const SHOW_TERMS_PLATFORMS = import.meta.env.VITE_SHOW_TERMS_PLATFORMS ? import.meta.env.VITE_SHOW_TERMS_PLATFORMS.split(',') : []
export const DEFAULT_DEV_CRYPTO_SYMBOLS = (import.meta.env.VITE_DEFAULT_CRYPTO_SYMBOLS || 'SOL')
    .split(',')
    .map((symbol: string) => symbol.trim())
    .filter(Boolean)
export const ROUTER_BASENAME = import.meta.env.VITE_ROUTER_BASENAME || undefined
export const currencyFormat = 'code'
