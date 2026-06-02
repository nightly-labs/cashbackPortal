import { ImgHTMLAttributes, useEffect, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'

interface IconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /** File name inside the platform's icon folder, e.g. `wallet.svg`. */
    name: string
    /**
     * Optional secondary file name to try before falling back to DEFAULT.
     * Useful for theme variants like `arrow-left-light.svg → arrow-left.svg`.
     */
    fallbackName?: string
}

/**
 * Renders an `<img>` for a portal icon, with automatic fallback to the
 * DEFAULT platform's icon folder when the active platform doesn't ship
 * the requested asset.
 *
 * Resolution chain (each step only fires after the previous 404s):
 *   1. /{PLATFORM}/icons/{theme}/{name}
 *   2. /{PLATFORM}/icons/{theme}/{fallbackName}     (if provided)
 *   3. /DEFAULT/icons/{theme}/{fallbackName ?? name}
 */
const Icon = ({ name, fallbackName, onError, alt = '', ...rest }: IconProps) => {
    const loaderData = useRouteLoaderData('root') as LoaderData
    const { iconsPath } = loaderData

    // The route loader builds `iconsPath` once on bootstrap. When the active
    // theme changes later (e.g. SESSION_UPDATE swaps stylesheets), that
    // path goes stale. Re-derive the theme from the live stylesheet link
    // so icons follow the current theme rather than the bootstrap one.
    const liveTheme = (() => {
        const link = document.getElementById('bring-portal-theme-default') as HTMLLinkElement | null
        if (link?.href.endsWith('dark.css')) return 'dark'
        if (link?.href.endsWith('light.css')) return 'light'
        return null
    })()
    const themedIconsPath = liveTheme
        ? iconsPath?.replace(/\/(light|dark)$/, `/${liveTheme}`)
        : iconsPath

    // Derive the DEFAULT path from the platform path so the fallback works
    // even on sessions that pre-date `defaultIconsPath` being added to the
    // loader. `iconsPath` looks like `/<PLATFORM>/icons/<theme>`; swap the
    // platform segment for `DEFAULT`.
    const defaultIconsPath =
        (liveTheme && loaderData.defaultIconsPath?.replace(/\/(light|dark)$/, `/${liveTheme}`)) ??
        loaderData.defaultIconsPath ??
        themedIconsPath?.replace(/^(?:\.\/|\/)?[^/]+\//, './DEFAULT/')

    // Build a deduped resolution chain so we never request the same URL twice
    // in a row (e.g. when `name === fallbackName` or platform === DEFAULT).
    const candidates = Array.from(new Set([
        `${themedIconsPath}/${name}`,
        ...(fallbackName ? [`${themedIconsPath}/${fallbackName}`] : []),
        `${defaultIconsPath}/${fallbackName ?? name}`,
        `${defaultIconsPath}/${name}`,
    ].filter(Boolean)))

    const [step, setStep] = useState(0)

    useEffect(() => {
        setStep(0)
    }, [name, fallbackName, themedIconsPath, defaultIconsPath])

    return (
        <img
            {...rest}
            alt={alt}
            src={candidates[step]}
            onLoad={(e) => {
                // Some dev servers (and SPA hosts) return index.html with a
                // 200 for missing static assets. The browser fires `load`,
                // not `error`, but the resulting image has zero natural
                // size. Treat that as a miss and try the next candidate.
                const img = e.currentTarget
                if (img.naturalWidth === 0) {
                    setStep((s) => (s < candidates.length - 1 ? s + 1 : s))
                    return
                }
                rest.onLoad?.(e)
            }}
            onError={(e) => {
                setStep((s) => {
                    if (s < candidates.length - 1) return s + 1
                    onError?.(e)
                    return s
                })
            }}
        />
    )
}

export default Icon
