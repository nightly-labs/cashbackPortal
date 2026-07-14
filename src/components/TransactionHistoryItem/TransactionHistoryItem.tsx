import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import styles from './styles.module.css'

export type TransactionHistoryTone = 'claimed' | 'pending' | 'canceled'

export interface TransactionHistoryDetail {
    text: string
    txid?: string
}

export interface TransactionHistoryItemProps {
    retailerName: string
    date: string
    amount: string
    status: string
    imageSrc: string
    imageSrcFallback?: string
    imageBackground?: string
    imageFit?: 'cover' | 'contain'
    details?: TransactionHistoryDetail[]
    expanded?: boolean
    tone?: TransactionHistoryTone
    visualState?: 'default' | 'hover'
    onToggle?: () => void
}

const getTone = (status: string): TransactionHistoryTone => {
    const normalizedStatus = status.toLowerCase()

    if (normalizedStatus.includes('cancel')) return 'canceled'
    if (normalizedStatus.includes('claim') || normalizedStatus.includes('complete')) return 'claimed'
    return 'pending'
}

/**
 * A compact Nightly transaction row with an optional inline details section.
 * The whole summary is keyboard-operable and exposes its expanded state.
 */
const TransactionHistoryItem = ({
    retailerName,
    date,
    amount,
    status,
    imageSrc,
    imageSrcFallback,
    imageBackground = '#FFFFFF',
    imageFit = 'cover',
    details = [],
    expanded = false,
    tone = getTone(status),
    visualState = 'default',
    onToggle,
}: TransactionHistoryItemProps) => {
    const hasDetails = details.some(({ text, txid }) => text || txid)
    const shouldReduceMotion = useReducedMotion()

    return (
        <article
            className={`${styles.root} ${visualState === 'hover' ? styles.hovered : ''}`}
            data-tone={tone}
        >
            <button
                className={styles.summary}
                type="button"
                aria-expanded={expanded}
                disabled={!hasDetails}
                onClick={hasDetails ? onToggle : undefined}
            >
                <span className={styles.identity}>
                    <span className={styles.imageFrame} style={{ background: imageBackground }}>
                        <img
                            className={styles.image}
                            style={{ objectFit: imageFit }}
                            src={imageSrc}
                            alt=""
                            onError={imageSrcFallback ? (event) => {
                                if (event.currentTarget.src !== imageSrcFallback) {
                                    event.currentTarget.src = imageSrcFallback
                                }
                            } : undefined}
                        />
                    </span>
                    <span className={styles.meta}>
                        <span className={styles.retailerName}>{retailerName}</span>
                        <span className={styles.date}>{date}</span>
                    </span>
                </span>

                <span className={styles.reward}>
                    <span className={styles.amount}>{amount}</span>
                    <span className={styles.status}>{status}</span>
                </span>
            </button>

            <AnimatePresence initial={false}>
                {expanded && hasDetails ? (
                    <motion.div
                        className={styles.detailsWrapper}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                    >
                        <div className={styles.detailsContent}>
                            <div className={styles.divider} />
                            <div className={styles.detailList}>
                                {details.map(({ text, txid }, index) => (
                                    <p className={styles.detail} key={`${text}-${txid ?? index}`}>
                                        {text}
                                        {txid ? <span className={styles.txid}>TxID: {txid}</span> : null}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </article>
    )
}

export default TransactionHistoryItem
