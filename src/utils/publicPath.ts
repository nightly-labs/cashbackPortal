export const publicPath = (path: string): string => {
    const normalizedPath = path.replace(/^\/+/, '')
    const base = import.meta.env.BASE_URL || '/'
    const preserveI18nPlaceholders = (url: string): string =>
        url.replace(/%7B/gi, '{').replace(/%7D/gi, '}')

    if (base === './' || base === '') {
        const baseUrl = import.meta.env.DEV
            ? new URL('/', window.location.origin)
            : new URL('../', import.meta.url)

        return preserveI18nPlaceholders(new URL(normalizedPath, baseUrl).toString())
    }

    return preserveI18nPlaceholders(new URL(normalizedPath, new URL(base, window.location.origin)).toString())
}
