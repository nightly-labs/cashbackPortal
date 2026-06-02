import styles from './styles.module.css'

const RetailerCardSkeleton = () => {
    return (
        <div className={styles.card}>
            <div className={`${styles.flag} ${styles.skeleton}`} />
            <div className={styles.skeleton_logo} />
            <div className={styles.text_content}>
                <div className={styles.skeleton_retailer_name} />
                <div className={styles.skeleton_cashback_rate} />
            </div>
            <div className={`${styles.shop_button} ${styles.skeleton_shop_button}`} />
        </div>
    )
}

export default RetailerCardSkeleton
