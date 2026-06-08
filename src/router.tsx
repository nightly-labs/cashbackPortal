import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import Home from './pages/Home/Home';
import History from './pages/History';
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion/FrequentlyAskedQuestion'
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import i18n from 'i18next';
import fetchToken from './api/fetchToken';
import { DEFAULT_DEV_CRYPTO_SYMBOLS, DEV_MODE, ENV, ROUTER_BASENAME, SHOW_TERMS_PLATFORMS } from './config';
import { v4 } from 'uuid';
import getUserId from './utils/getUserId';
import { loadStylesheet } from './utils/loadStylesheet';
import { publicPath } from './utils/publicPath';

const rootLoader = async () => {
    const params = new URLSearchParams(document.location.search)
    const token = params.get('token')
    // URL-provided values are kept as a fallback for backward compatibility.
    // The token (verify response) is the newer source of truth and wins when
    // it carries the value.
    const urlExtensionId = params.get('extensionId')
    const urlTheme = params.get('theme')?.toLowerCase()
    const flowId = v4()

    // If token is provided, use it (works in both dev and prod mode)
    if (token) {
        const res = await fetchToken({ token });
        if (!res || res.status !== 200 || !res.info || !Object.keys(res.info).length) throw Error('There was an error while loading the page')
        const platform = res.info.platform?.toUpperCase() || 'DEFAULT'

        // Resolution order: token (newer) → URL (legacy) → default.
        // terms & autoclaim come from the token only (no URL fallback).
        const theme = res.info.theme?.toLowerCase() || urlTheme || 'light'
        const extensionId = res.info.extensionId || urlExtensionId || null
        const showTerms = res.info.terms !== false || SHOW_TERMS_PLATFORMS.includes(platform)
        const autoclaim = !!res.info.autoclaim

        loadStylesheet(theme, platform)
        // Make sure the platform translation bundle is fetched before we
        // switch to it as the default namespace; missing keys fall back
        // to DEFAULT (configured via `fallbackNS` in utils/i18n.ts).
        await i18n.loadNamespaces(platform)
        i18n.setDefaultNamespace(platform)

        if (ENV === 'prod') {
            delete res.info.isTester
        } else {
            res.info.isTester = !!res.info.isTester
        }

        return {
            ...res.info,
            platform,
            iconsPath: publicPath(`${platform}/icons/${theme}`),
            defaultIconsPath: publicPath(`DEFAULT/icons/${theme}`),
            userId: getUserId(platform),
            extensionId,
            showTerms,
            autoclaim,
            flowId
        }
    }

    // Fallback to dev mode parameters if no token provided
    if (DEV_MODE) {
        const theme = urlTheme || 'light'
        const platform = params.get('platform')?.toUpperCase()
        const cryptoSymbols = params.get('cryptoSymbols')?.split(',').map(symbol => symbol.trim()).filter(Boolean) || DEFAULT_DEV_CRYPTO_SYMBOLS
        const showTerms = params.get('terms')?.toLowerCase() !== 'false' || SHOW_TERMS_PLATFORMS.includes(platform || '')
        const autoclaim = params.get('autoclaim') === 'true'
        const dev = {
            walletAddress: params.get('walletAddress') || null,
            platform,
            cryptoSymbols,
            isCountryAvailable: true,
        }
        if (!dev.platform) throw Error('Missing platform')
        loadStylesheet(theme, dev.platform)
        await i18n.loadNamespaces(dev.platform)
        i18n.setDefaultNamespace(dev.platform)
        return {
            ...dev,
            iconsPath: publicPath(`${dev.platform}/icons/${theme}`),
            defaultIconsPath: publicPath(`DEFAULT/icons/${theme}`),
            userId: getUserId(dev.platform),
            isTester: false,
            flowId,
            showTerms,
            autoclaim,
            extensionId: urlExtensionId
        }
    }

    // If no token and not in dev mode, throw error
    throw Error('There was an error while loading the page')
}

const router = createBrowserRouter([
    {
        id: "root",
        path: "/",
        element: <Layout />,
        errorElement: <ErrorMessage />,
        loader: rootLoader,
        shouldRevalidate: () => false,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'history',
                element: <History />,
            },
            {
                path: 'faq',
                element: <FrequentlyAskedQuestion />,
            },
        ],
    },
], {
    basename: ROUTER_BASENAME,
});

export default router;
