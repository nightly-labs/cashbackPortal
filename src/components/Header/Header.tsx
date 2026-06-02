import styles from './styles.module.css'
import { useTranslation } from 'react-i18next'
import { Link, useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from '../../utils/hooks/useWalletAddress'
import { ENV } from '../../config'

const Header = () => {
    const { t } = useTranslation()
    const { platform } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress}&env=${ENV}`

    return (
        <div className={styles.header}>
            {
                t('title') ?
                    <h1 className={styles.title}>{t('title')}</h1>
                    : null
            }
            {
                t('subtitle') ?
                    <h2 className={styles.subtitle}>{t('subtitle')}</h2>
                    : null
            }
            <div className={styles.btns}>
                <Link
                    id="header-faq-link"
                    to={'/faq'}
                    className={styles.btn}
                >
                    {t('needHelp')}
                </Link>
                <Link
                    id="header-support-link"
                    to={supportUrl}
                    target='_blank'
                    className={styles.btn}
                >
                    {t('frequentlyAskedQuestion')}
                </Link>
            </div>
        </div>
    )
}

export default Header
