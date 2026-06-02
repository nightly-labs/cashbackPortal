import styles from './styles.module.css'
import fetchCache from '../../api/fetchCache'
import StatusModal from '../Modals/StatusModal/StatusModal'
import { useRouteLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { type CSSProperties, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import claimSubmit from '../../api/claim/submit'
import claimInitiate from '../../api/claim/initiate'
import { Oval } from 'react-loader-spinner'
import message from '../../utils/message'
import { useQueryClient } from '@tanstack/react-query'
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { formatCurrency } from '../../pages/History/helpers'
import { ENV } from '../../config'
import { useWalletAddress } from '../../utils/hooks/useWalletAddress'
import LoginModal from '../Modals/LoginModal/LoginModal'
import Icon from '../Icon/Icon'
import { publicPath } from '../../utils/publicPath'


const Rewards = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { sendGaEvent } = useGoogleAnalytics()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    const { platform, cryptoSymbols, userId, flowId, autoclaim } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [modalState, setModalState] = useState('close')
    const [loginModalState, setLoginModalState] = useState('close')
    const [claimStatus, setClaimStatus] = useState<'success' | 'failure' | 'loading'>('loading')
    const [loading, setLoading] = useState(false)
    const isAutoClaim = autoclaim
    const limit = searchParams.get('limit') || Infinity

    const { data: balance } = useQuery({
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
    const currentCryptoSymbol = balance?.data?.eligible[0]?.tokenSymbol || cryptoSymbols[0]
    const minimumClaimThreshold = balance?.data?.eligible[0]?.minimumClaimThreshold || -1
    const eligibleTokenNumber = balance?.data?.eligible[0]?.tokenAmount || -1
    const claimAmount = ENV === 'prod' ? eligibleTokenNumber : Math.min(eligibleTokenNumber, +limit)

    useEffect(() => {
        // Define the message handler
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.to !== 'bringweb3' || event.origin === window.location.origin) {
                return; // Ignore messages from untrusted origins
            }
            // Handle the message data here
            if (event.data.action === 'SIGNATURE') {
                sendGaEvent('claim_submit', {
                    category: 'user_action',
                    details: claimAmount,
                    process: 'submit'
                })
                setModalState('open')
                const body: Parameters<typeof claimSubmit>[0] = {
                    walletAddress,
                    targetWalletAddress: walletAddress,
                    tokenSymbol: currentCryptoSymbol,
                    tokenAmount: claimAmount,
                    signature: event.data.signature,
                    message: event.data.message,
                    platform,
                    userId,
                    flowId
                }
                if (event.data.key) body.key = event.data.key
                const res = await claimSubmit(body)

                if (res.status === 202) {
                    setClaimStatus('success')
                    sendGaEvent('claim_accepted', {
                        category: 'system',
                        action: 'request',
                        details: claimAmount,
                    })
                    queryClient.invalidateQueries({ queryKey: ["balance", walletAddress] })
                } else {
                    setClaimStatus('failure')
                    sendGaEvent('claim_failed', {
                        category: 'system',
                        action: 'request',
                        details: `${claimAmount}, ${res}`,
                    })
                }
                setLoading(false)
            } else if (event.data.action === 'ABORT_SIGN_MESSAGE') {
                setLoading(false)
            }
        };

        // Set up the event listener
        window.addEventListener('message', handleMessage);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('message', handleMessage);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimAmount, currentCryptoSymbol, eligibleTokenNumber, loading, platform, queryClient, sendGaEvent, walletAddress]);

    // Get the message to sign from the API and post a message to parent page a request to sign the message
    const signMessage = async () => {
        setLoading(true)

        const res = await claimInitiate({
            platform,
            walletAddress,
            targetWalletAddress: walletAddress,
            tokenSymbol: currentCryptoSymbol,
            tokenAmount: claimAmount,
            userId,
            flowId
        })

        sendGaEvent('claim_open', {
            category: 'user_action',
            action: 'click',
            details: claimAmount,
            process: 'initiate'
        })

        const messageToSign = res?.messageToSign

        if (!messageToSign) {
            setLoading(false)
            return
        }

        message({ messageToSign, amount: claimAmount, action: 'SIGN_MESSAGE', tokenSymbol: currentCryptoSymbol })
    }

    const eligibleTokenAmount =
        (balance?.data?.eligible[0]?.tokenAmount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            // minimumFractionDigits: balance?.data?.eligible[0]?.tokenAmount ? 0 : 2,
            maximumFractionDigits: 2,
        })

    const eligibleTotalEstimatedUsd = formatCurrency(balance?.data?.eligible[0]?.totalEstimatedUsd ?? 0)
    // (balance?.data?.eligible[0]?.totalEstimatedUsd ?? 0).toLocaleString(undefined, {
    //     style: "currency",
    //     currency: "USD",
    // })

    const pendingTokenAmount =
        (balance?.data?.totalPendings[0]?.tokenAmount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            // minimumFractionDigits: balance?.data?.totalPendings[0]?.tokenAmount ? 0 : 2,
            maximumFractionDigits: 2,
        })

    const pendingTotalEstimatedUsd = formatCurrency(balance?.data?.totalPendings[0]?.totalEstimatedUsd ?? 0)
    const earnedTokenNumber = (balance?.data?.eligible[0]?.tokenAmount ?? 0) + (balance?.data?.totalPendings[0]?.tokenAmount ?? 0)
    const earnedTokenAmount = earnedTokenNumber.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })
    const earnedTotalEstimatedUsd = formatCurrency(
        (balance?.data?.eligible[0]?.totalEstimatedUsd ?? 0) + (balance?.data?.totalPendings[0]?.totalEstimatedUsd ?? 0)
    )
    const assetsPath = publicPath(`${platform}/assets`)
    const earnedCardStyle = {
        '--earned-pattern-url': `url("${assetsPath}/piglet-pattern.svg")`,
    } as CSSProperties

    return (
        <div className={styles.container}>
            <div className={styles.earned_card} style={earnedCardStyle}>
                <div className={styles.earned_content}>
                    <div className={styles.earned_label}>
                        <img className={styles.earned_icon} src={`${assetsPath}/piglet.svg`} alt="" aria-hidden="true" />
                        <span>Cashback earned</span>
                    </div>
                    <div className={styles.earned_amount}>{earnedTokenAmount} {currentCryptoSymbol}</div>
                    <div className={styles.earned_value}>Current value: {earnedTotalEstimatedUsd}</div>
                </div>
                <img className={styles.earned_art} src={`${assetsPath}/fennec.png`} alt="" aria-hidden="true" />
            </div>
            <div className={styles.rewards_row}>
                {!isAutoClaim ?
                    <div className={`${styles.subcontainer} ${styles.claimable_card}`}>
                        <img className={styles.reward_art} src={`${assetsPath}/tip-jar.svg`} alt="" aria-hidden="true" />
                        <div className={styles.reward_details}>
                            <div className={`${styles.icon_container} ${styles.claim_icon}`}>
                                <Icon
                                    className={styles.icon}
                                    name="gift.svg"
                                    alt="gift icon"
                                />
                            </div>
                            <div className={styles.reward_details_subcontainer}>
                                <div className={styles.reward_label}>Claimable</div>
                                <div className={`${styles.amount} ${styles.amount_claim}`}>
                                    {balance?.data?.eligible[0]?.tokenAmount ? `${eligibleTokenAmount} ${currentCryptoSymbol}` : `0 ${cryptoSymbols[0]}`}
                                </div>
                                <div className={`${styles.rewards_usd} ${styles.claim_usd}`}>
                                    {+eligibleTokenAmount.split(/\s/)[0] < minimumClaimThreshold ?
                                        `Minimum claim amount: ${minimumClaimThreshold} ${currentCryptoSymbol}`
                                        :
                                        `Current value: ${eligibleTotalEstimatedUsd}`
                                    }

                                </div>
                            </div>
                        </div>
                        <button
                            id="rewards-claim-btn"
                            className={`${styles.btn} ${styles.claim_btn}`}
                            onClick={() => signMessage()}
                            disabled={eligibleTokenNumber === -1 || minimumClaimThreshold === -1 || eligibleTokenNumber < minimumClaimThreshold || loading}
                        >
                            {
                                loading ?
                                    <Oval
                                        visible={true}
                                        height="20"
                                        width="20"
                                        color="#fff"
                                        secondaryColor='grey'
                                        strokeWidth={6}
                                        ariaLabel="oval-loading"
                                    />
                                    :
                                    t('claimCashback')
                            }
                        </button>
                    </div>
                    : null}
                <div className={`${styles.subcontainer} ${styles.pending_card} ${isAutoClaim ? styles.full_width : ''}`}>
                    <img className={styles.reward_art} src={`${assetsPath}/hourglass.svg`} alt="" aria-hidden="true" />
                    <div className={styles.reward_details}>
                        <div className={`${styles.icon_container} ${styles.pending_icon}`}>
                            <Icon className={styles.icon} name="coins.svg" alt="coins icon" />
                        </div>
                        <div className={styles.reward_details_subcontainer}>
                            <div className={styles.reward_label}>Pending</div>
                            <div className={`${styles.amount} ${styles.amount_pending}`}>
                                <span>
                                    {`${balance?.data?.totalPendings[0]?.tokenAmount ? `${pendingTokenAmount} ${currentCryptoSymbol}` : `0 ${cryptoSymbols[0]}`}`}
                                </span>
                                {
                                    t('pendingRewards') !== 'pendingRewards' ?
                                        <span className={styles.pending_rewards_text}> {t('pendingRewards')}</span>
                                        : null
                                }
                            </div>
                            <div className={`${styles.rewards_usd} ${styles.pending_usd}`}>Current value: <br className={styles.br} />{pendingTotalEstimatedUsd}</div>
                        </div>
                    </div>
                    <button
                        id="rewards-view-btn"
                        className={`${styles.btn} ${styles.pending_btn}`}
                        onClick={() => walletAddress ? navigate('/history') : setLoginModalState('open')}
                    >
                        <img
                            className={styles.pending_btn_icon}
                            src={`${assetsPath}/arrow-right.svg`}
                            alt=""
                            aria-hidden="true"
                        />
                        {t('viewRewards')}
                    </button>
                </div>
            </div>
            <StatusModal
                status={claimStatus}
                open={modalState !== 'close'}
                closeFn={() => {
                    setModalState('close')
                    setClaimStatus('loading')
                }}
            />
            <LoginModal
                closeFn={() => setLoginModalState('close')}
                open={loginModalState !== 'close'}
            />
        </div>
    )
}

export default Rewards
