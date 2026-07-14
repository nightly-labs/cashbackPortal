import { currencyFormat } from "../../config"

export const formatCurrency = (amount: number | undefined) => {
    if (typeof amount === 'undefined' || amount < 0) return 0

    if (currencyFormat === 'code') {
        return amount.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
            currencyDisplay: "code",
        }).split(/\s/).reverse().join(' ')
    }

    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    })
}

export const formatDate = (date: string): string => {
    const format = new Date(date)

    return format.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

export const createTransactionDetails = (description: string[][]) => description
    .filter(([date, text, txid]) => date || text || txid)
    .map(([date, text, txid]) => ({
        text: description.length > 1
            ? [date, text].filter(Boolean).join(' — ')
            : text || date,
        txid,
    }))

export const daysLeft = (date: string): number => {
    const targetDate: Date = new Date(date)

    const currentDate: Date = new Date()

    const timeDifference: number = targetDate.getTime() - currentDate.getTime()

    return Math.max(1, Math.ceil(timeDifference / (1000 * 60 * 60 * 24)))
}

export const formatStatus = (status: string, eligibleDate?: string) => {
    let days: number | undefined = undefined
    if (eligibleDate) {
        days = daysLeft(eligibleDate)
    }

    switch (status) {
        case "claimed":
            return "Claimed";
        case "completed":
            return "Completed";
        case "pending":
            return `In ${days} ${days && days > 1 ? "days" : "day"}`;
        case "cancelled":
            return "Canceled";
        default:
            return `In ${days} ${days && days > 1 ? "days" : "day"}`;
    }
}

interface Item {
    date: string
    action: string
    tokenAmount: number
    tokenSymbol: string
    correctionReason?: string
    description?: string
    retailerName?: string
}

export const createDescription = (item: Item) => {
    if (item.description) {
        return [formatDate(item.date), item.description]
    }

    switch (item.action) {
        case "PURCHASE_POSTED":
            return [formatDate(item.date),
            `${item.tokenAmount + " " + item.tokenSymbol} rewards for purchasing${item.retailerName ? ` at ${item.retailerName}` : ''}. Status: Pending for the end of the return period.`]
        case "PURCHASE_APPROVED":
            return [formatDate(item.date), `${item.tokenAmount + " " + item.tokenSymbol} eligible rewards for purchasing${item.retailerName ? ` at ${item.retailerName}` : ''}.`]
        case "PURCHASE_CORRECTED":
            return (
                [formatDate(item.date),
                `${item.tokenAmount + " " + item.tokenSymbol} — purchase corrected. ${item.correctionReason ? item.correctionReason : ""}`]
            )
        default:
            return ['']
    }
}
