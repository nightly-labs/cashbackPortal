const resetEmbeddingScroll = () => {
    window.parent.postMessage({
        action: 'PORTAL_SCROLL_RESET',
        from: 'bringweb3',
    }, '*')

    if (window.location.protocol !== 'chrome-extension:') return

    const reset = () => {
        try {
            const parentDocument = window.parent?.document
            if (!parentDocument) return

            window.parent.scrollTo(0, 0)
            parentDocument.documentElement.scrollTop = 0
            parentDocument.body.scrollTop = 0

            parentDocument.querySelectorAll('*').forEach(element => {
                if (element instanceof HTMLElement) {
                    element.scrollTop = 0
                }
            })
        } catch {
            // Cross-origin embeds cannot be adjusted directly.
        }
    }

    reset()
    window.requestAnimationFrame(reset)
    window.setTimeout(reset, 0)
}

export default resetEmbeddingScroll
