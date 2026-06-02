export const API_KEY = import.meta.env.VITE_API_KEY || ''
export const API_URL_PLATFORMS = `${import.meta.env.VITE_API_URL}platforms/`
export const API_URL_PORTAL = `${import.meta.env.VITE_API_URL}portal/`
export const DEV_MODE = import.meta.env.VITE_ENV === 'development'
export const GA_MEASUREMENT_ID = import.meta.env.VITE_ENV_GA_MEASUREMENT_ID || ''
export const ENV = import.meta.env.VITE_ENV || 'development'
export const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
export const SHOW_TERMS_PLATFORMS = import.meta.env.VITE_SHOW_TERMS_PLATFORMS ? import.meta.env.VITE_SHOW_TERMS_PLATFORMS.split(',') : []
export const ROUTER_BASENAME = import.meta.env.VITE_ROUTER_BASENAME || undefined
export const currencyFormat = 'code'
