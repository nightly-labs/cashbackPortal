import styles from './styles.module.css'
import { useEffect, useMemo, useState } from 'react'
import formatCashback from '../../utils/formatCashback'
import { useRouteLoaderData } from 'react-router-dom'
import activate from '../../api/activate'
import RetailerCardModal from '../Modals/RetailerCardModal/RetailerCardModal'
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { useWalletAddress } from '../../utils/hooks/useWalletAddress'
import LoginModal from '../Modals/LoginModal/LoginModal'
import fetchTerms from '../../utils/fetchTerms'
import { getInitials } from '../../utils/getInitials'
import Icon from '../Icon/Icon'
import resetEmbeddingScroll from '../../utils/resetEmbeddingScroll'

const isBigCashback = (symbol: string, amount: number) => {
    switch (symbol) {
        case "%":
            return amount > 4
        case "$":
            return amount > 10
        default:
            return false
    }
}

interface Props extends Retailer {
    topGeneralTerms: string
    campaignUrl?: string
    generalTerms: string
    termsUrl: string
    search: ReactSelectOptionType | null
    isDemo: boolean
}

const RetailerCard = ({
    id,
    iconPath,
    name,
    displayName,
    section,
    backgroundColor,
    maxCashback,
    cashbackSymbol,
    cashbackCurrency,
    termsUrl,
    campaignUrl,
    topGeneralTerms,
    generalTerms,
    search,
    isDemo,
    campaignId
}: Props) => {
    const { platform, cryptoSymbols, userId, flowId, iconsPath } = useRouteLoaderData('root') as LoaderData
    const { walletAddress, isTester } = useWalletAddress()
    const { sendGaEvent } = useGoogleAnalytics()
    const [fallbackLogo, setFallbackLogo] = useState('')
    const [redirectLink, setRedirectLink] = useState('')
    const [popupData, setPopupData] = useState<{ iframeUrl?: string, token?: string, domain?: string }>({})
    const [modalState, setModalState] = useState('close')
    const [loginModalState, setLoginModalState] = useState('close')
    const [terms, setTerms] = useState('')

    const cashback = useMemo(() => formatCashback(maxCashback, cashbackSymbol, cashbackCurrency), [cashbackCurrency, cashbackSymbol, maxCashback])
    const isBig = useMemo(() => isBigCashback(cashbackSymbol, maxCashback), [cashbackSymbol, maxCashback])
    const isCampaign = useMemo(() => Boolean(campaignId), [campaignId])

    const label = displayName || name

    const offerName = useMemo(() => {
        // Long names (>26 chars) are always truncated to 24 + ".."
        if (label.length > 26) return label.slice(0, 24) + '..'

        // Search results with a section: show "name/section"
        // Truncate section to fit within 24 chars total, minimum 3 chars of section shown
        // If section can't fit 3 chars, show name only
        if (search && section) {
            const full = `${label}/${section}`
            if (full.length <= 24) return full
            const availableForSection = 24 - label.length - 1 - 2 // 1 for "/", 2 for ".."
            if (availableForSection >= 3) return `${label}/${section.slice(0, availableForSection)}..`
            return label
        }

        // Search results without a section: show name (already truncated above if >26)
        if (search) return label

        // Default (non-search): show "/section" if available, otherwise name
        return section ? `/${section}` : label
    }, [label, search, section])

    const activateDeal = async () => {
        if (!walletAddress) return

        const body: Parameters<typeof activate>[0] = {
            platform,
            itemId: id,
            walletAddress,
            userId,
            flowId,
            tokenSymbol: cryptoSymbols[0]
        }

        if (search?.value) body['search'] = search.value

        if (isTester && isDemo) body.isDemo = true

        const res = await activate(body)
        setPopupData({
            iframeUrl: res.iframeUrl,
            token: res.token,
            domain: res.domain
        })
        setRedirectLink(res.url)
        setModalState('open')
    }

    const handleClick = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
        }
        resetEmbeddingScroll()

        if (!walletAddress) {
            setLoginModalState('open')
            return
        }
        activateDeal()
        setModalState('loading')
        sendGaEvent('retailer_open', {
            category: 'user_action',
            action: 'click',
            details: label,
            process: 'activate'
        })
    }

    useEffect(() => {
        if (!termsUrl || terms.length || modalState === 'close') return

        const fetches = [fetchTerms(termsUrl)]
        if (campaignUrl) fetches.push(fetchTerms(campaignUrl))

        Promise.all(fetches)
            .then(([retailerTerms, campaignTerms]) => {
                setTerms(campaignTerms || topGeneralTerms + retailerTerms + generalTerms)
            })
            .catch(console.error)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalState])

    return (
        <>
            <div
                id={`retailer-card-${name}`}
                className={styles.card}
                style={isCampaign ? { background: `url(${iconsPath}/campaign-card-background.png) lightgray 50% / cover no-repeat` } : {}}
                onClick={handleClick}
            >
                {isBig || isCampaign ? <div className={`${styles.flag} ${isCampaign ? styles.flag_campaign : ''}`}>{cashback}</div> : null}
                <div
                    id={`retailer-logo-container-${name}`}
                    className={`${fallbackLogo ? styles.fallback_logo_container : styles.logo_container} ${isCampaign ? styles.logo_container_campaign : ''}`}
                    style={!fallbackLogo ? { backgroundColor: backgroundColor || 'white' } : undefined}
                >
                    {fallbackLogo ?
                        <div className={`${styles.fallback_logo} ${fallbackLogo.length === 2 ? styles.fallback_logo_two_letters : ''}`}>{fallbackLogo}</div>
                        :
                        <img
                            id={`retailer-logo-${name}`}
                            className={styles.logo}
                            loading='eager'
                            src={iconPath}
                            alt={`${label} logo`}
                            onError={() => setFallbackLogo(getInitials(label))}
                        />
                    }
                </div>
                <div className={styles.text_content}>
                    <div id={`retailer-name-${name}`} className={styles.retailer_name}>{offerName}</div>
                    <div id={`retailer-cashback-rate-${name}`} className={`${styles.cashback_rate} ${isCampaign ? styles.cashback_rate_campaign : ''}`}>
                        {!isCampaign ? <span className={styles.cashback_prefix}>Up to </span> : null}
                        <span className={styles.cashback_value}>{cashback}</span>
                        <span className={styles.cashback_currency}> in {cryptoSymbols[0]}</span>
                        <span className={styles.cashback_word}> cashback</span>
                    </div>
                </div>
                <span className={styles.shop_button} aria-hidden="true">
                    <span>Shop</span>
                    <span className={styles.shop_icon_frame}>
                        <Icon className={styles.shop_icon} name="openWebsite.svg" alt="" />
                    </span>
                </span>
            </div>
            <RetailerCardModal
                open={modalState !== 'close'}
                closeFn={() => {
                    setModalState('close')
                    sendGaEvent('popup_close', {
                        category: 'user_action',
                        action: 'click',
                        details: 'Retailer',
                    })
                }}
                {...(!fallbackLogo && { backgroundColor })}
                iconPath={iconPath}
                name={label}
                cashback={cashback}
                terms={terms}
                redirectLink={redirectLink}
                fallbackLogo={fallbackLogo}
                {...popupData}
            />
            <LoginModal
                open={loginModalState !== 'close'}
                closeFn={() => setLoginModalState('close')}
            />
        </>
    )
}

export default RetailerCard
