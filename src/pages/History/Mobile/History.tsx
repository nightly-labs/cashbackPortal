import styles from './styles.module.css'
import { Link, useRouteLoaderData, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import fetchCache from '../../../api/fetchCache'
import { createDescription, createTransactionDetails, formatCurrency, formatDate, formatStatus } from '../helpers'
import { useGoogleAnalytics } from '../../../utils/hooks/useGoogleAnalytics'
import { useTranslation } from 'react-i18next'
import { useWalletAddress } from '../../../utils/hooks/useWalletAddress'
import Icon from '../../../components/Icon/Icon'
import TransactionHistoryItem from '../../../components/TransactionHistoryItem/TransactionHistoryItem'

interface HistoryMobile {
    status: string
    tokenAmount: string;
    imgSrc: string
    imgSrcFallback?: string
    description: string[][];
    totalEstimatedUsd?: string | number
    imgBg?: string
    retailerName?: string
}

interface RowProps extends HistoryMobile {
    isActive: boolean
    toggleFn: () => void
}

interface ClaimToken {
    tokenAmount: number
    description: string[][]
    tokenSymbol: string
}

interface ClaimsRes {
    [key: string]: ClaimToken
}

const Row = ({ isActive, toggleFn, imgSrc, imgSrcFallback, status, tokenAmount, imgBg, retailerName = 'Total claims', description }: RowProps): JSX.Element => {
    const isClaimSummary = retailerName === 'Total claims'

    return (
        <TransactionHistoryItem
            retailerName={retailerName}
            date={description[0]?.[0] ?? ''}
            amount={tokenAmount}
            status={status}
            imageSrc={imgSrc}
            imageSrcFallback={imgSrcFallback}
            imageBackground={imgBg || (isClaimSummary ? 'var(--history-claimed-icon-bg)' : '#FFFFFF')}
            imageFit={isClaimSummary ? 'contain' : 'cover'}
            details={createTransactionDetails(description)}
            expanded={isActive}
            onToggle={toggleFn}
        />
    )
}

const HistoryMobile = () => {
    const [activeRow, setActiveRow] = useState(-1)
    const { sendGaEvent } = useGoogleAnalytics()
    const { t } = useTranslation()

    const { platform, iconsPath, defaultIconsPath, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const navigate = useNavigate()

    const { data } = useQuery({
        queryFn: async () => {
            const body: Parameters<typeof fetchCache>[0] = {
                platform,
                userId,
                flowId
            }

            if (walletAddress) body.walletAddress = walletAddress

            return await fetchCache(body)
        },
        queryKey: ["balance", walletAddress],
        enabled: !!walletAddress,
    })

    const balance = data?.data

    const createClaims = (claims: Claim[] | undefined): HistoryMobile[] => {
        if (!claims) return []
        const res: ClaimsRes = {}

        claims.map(claim => {
            const { tokenSymbol, tokenAmount, date, txid } = claim
            if (!res[tokenSymbol]) res[tokenSymbol] = { tokenSymbol, tokenAmount: 0, description: [] }
            
            const descriptionItem: string[] = [formatDate(date), `${tokenAmount} ${tokenSymbol}`]
            if (txid) {
                descriptionItem.push(txid)
            }
            
            res[tokenSymbol].description.push(descriptionItem)
            res[tokenSymbol].tokenAmount += tokenAmount
        })

        const arr = Object.keys(res).map(key => ({
            ...res[key]
            , tokenAmount: `${res[key].tokenAmount} ${key}`,
            imgSrc: `${iconsPath}/gift.svg`,
            imgSrcFallback: `${defaultIconsPath}/gift.svg`,
            tokenSymbol: key,
            status: formatStatus('claimed'),
        }))

        return arr
    }

    const createDeals = (deals: Deal[] | undefined, retailerIconBasePath: string | undefined): HistoryMobile[] => {
        if (!deals || !retailerIconBasePath) return []
        return deals.map(deal => ({
            tokenAmount: `${deal.tokenAmount} ${deal.tokenSymbol}`,
            totalEstimatedUsd: formatCurrency(deal.totalEstimatedUsd),
            status: formatStatus(deal.status, deal.eligibleDate),
            retailerName: deal.retailerName,
            imgSrc: `${retailerIconBasePath}${deal.retailerIconPath}`,
            imgBg: deal.retailerBackgroundColor,
            description: deal.history?.map(history => createDescription(history)) || [['']]
        }))
    }
    const [imgExists, setImgExists] = useState(true)
    const history = createClaims(balance?.movements.claims).concat(createDeals(balance?.movements.deals, data?.retailerIconBasePath))

    return (
        <div className={styles.container}>
            <Link
                id="history-mobile-back-btn"
                className={styles.back_btn}
                to='..'
                onClick={e => {
                    e.preventDefault()
                    sendGaEvent('topbar_back', {
                        category: 'user_action',
                        action: 'click',
                        details: 'to: /'
                    })
                    navigate(-1)
                }}
            >
                <Icon name="arrow-left.svg" alt="" />

            </Link>
            {balance?.movements.claims.length || balance?.movements.deals.length ? (
                <div className={styles.table}>
                    {
                        history.map((item, i) =>
                            <Row
                                key={`history-${i}`}
                                isActive={activeRow === i}
                                toggleFn={() => {
                                    if (activeRow !== i) {
                                        setActiveRow(i)
                                        sendGaEvent('history_expand', {
                                            category: 'user_action',
                                            action: 'click',
                                            details: item.retailerName || 'Total claims',
                                        })
                                    } else {
                                        setActiveRow(-1)
                                    }
                                }}
                                {...item}
                            />
                        )
                    }
                </div>
            ) : (
                <div className={styles.empty_container}>
                    {imgExists ? (
                        <Icon
                            name="no-history.svg"
                            alt="history"
                            onError={() => setImgExists(false)}
                        />
                    ) : null}
                    <div className={styles.empty_history}>{t('emptyHistory')}</div>
                </div>
            )}
        </div>
    )
}

export default HistoryMobile;
