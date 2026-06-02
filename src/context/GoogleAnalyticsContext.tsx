import { FC, createContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import ReactGA from 'react-ga4';
import analytics from '../api/analytics';
import { useWalletAddress } from '../utils/hooks/useWalletAddress';

type EventName =
    | "retailer_open"
    | "retailer_shop"
    | "rewards_open"
    | "popup_close"
    | "clear_selection"
    | "search_input"
    | "search_select"
    | "history_expand"
    | "category_select"
    | "claim_open"
    | "claim_submit"
    | "claim_accepted"
    | "claim_failed"
    | "page_view"

interface GAEvent {
    category: "user_action" | "system";
    action?: "click" | "input" | "select" | "request";
    details?: string;
    process?: "activate" | "initiate" | "submit";
}

interface BackendEvent {
    category: "user_action" | "system";
    action?: "click" | "input" | "select" | "request";
    details?: unknown;
    process?: "activate" | "initiate" | "submit";
}

interface GoogleAnalyticsContextType {
    sendGaEvent: (name: EventName, event: GAEvent) => void;
    sendPageViewEvent: (path: string) => void;
}

export const GoogleAnalyticsContext = createContext<GoogleAnalyticsContextType | undefined>(undefined);

interface Props {
    measurementId: string
    children: ReactNode
    platform: string
    location: string
    userId: string
    flowId: string
}

export const GoogleAnalyticsProvider: FC<Props> = ({ measurementId, children, platform, location, flowId, userId }) => {
    const effectRan = useRef('')
    const { walletAddress } = useWalletAddress()

    const sendBackendEvent = useCallback(async (name: EventName, event: BackendEvent) => {

        if (event.details && typeof event.details === 'object' && !Array.isArray(event.details)) {
            const tmpEvent = structuredClone({ ...event, ...event.details })
            delete tmpEvent.details
            event = tmpEvent
        }

        const backendEvent: Parameters<typeof analytics>[0] = {
            ...event,
            type: name,
            platform,
            userId,
            flowId,
        }

        if (walletAddress) backendEvent.walletAddress = walletAddress

        try {
            return await analytics(backendEvent)
        } catch (error) {
            console.error('BRING: Error sending analytics event', error)
            return { success: false, error }
        }
    }, [flowId, platform, walletAddress, userId])

    useEffect(() => {
        if (!measurementId) return
        if (ReactGA.isInitialized && measurementId) return;

        ReactGA.initialize(measurementId, {
            gaOptions: {
                storage: 'none',
                storeGac: false,
                cookieFlags: 'SameSite=None;Secure'
            },
            gtagOptions: {
                anonymize_ip: true,
                cookie_update: false,
                platform,
                source: 'portal',
                walletAddress
            }
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (window.origin.includes('localhost')) {
            return
        }

        if (effectRan.current === location) return

        const details: { [key: string]: string } = {
            pageLocation: window.location.href,
            pagePath: window.location.pathname,
            pageTitle: document.title,
            parentLocation: location
        }

        sendBackendEvent('page_view', {
            category: 'system',
            details
        })

        effectRan.current = location
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    const sendPageViewEvent = (): void => {

        if (window.origin.includes('localhost')) {
            return
        }
        if (!ReactGA.isInitialized) {
            console.warn('BRING: Google Analytics is not initialized');
            return
        }
        ReactGA.send({
            hitType: 'pageview',
            page_location: window.location.href,
            page_path: window.location.pathname,
            page_title: document.title,
        });
    };

    const sendGaEvent = async (name: EventName, event: GAEvent, disableGA: boolean = false): Promise<void> => {

        if (window.origin.includes('localhost')) return

        await sendBackendEvent(name, event)

        if (!ReactGA.isInitialized) {
            console.warn('BRING: Google Analytics is not initialized');
            return
        }

        if (disableGA) return

        const params: { [key: string]: unknown } = {
            ...event,
            platform,
            source: 'portal'
        }

        if (walletAddress) params.walletAddress = walletAddress
        ReactGA.event(name, params)
        return
    };

    return (
        <GoogleAnalyticsContext.Provider value={{ sendGaEvent, sendPageViewEvent }}>
            {children}
        </GoogleAnalyticsContext.Provider>
    );
};
