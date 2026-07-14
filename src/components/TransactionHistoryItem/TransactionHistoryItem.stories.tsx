import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import TransactionHistoryItem from './TransactionHistoryItem'

const aliexpressLogo = '/storybook-assets/aliexpress.png'

const details = [
    {
        text: 'This reward is based on spending 125 USD, yielding 4% cashback and converted based on SOL market price.',
    },
    {
        text: 'Street: Main Street 32, City',
    },
]

const meta = {
    title: 'Nightly/Transaction History/Item',
    component: TransactionHistoryItem,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'A responsive transaction row based on the compact, expanded and hover states from the Nightly Figma library.',
            },
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: 328 }}>
                <Story />
            </div>
        ),
    ],
    args: {
        retailerName: 'AliExpress',
        date: '05/08/2026',
        amount: '0.021 SOL',
        status: 'Claimed',
        imageSrc: aliexpressLogo,
        details,
        expanded: false,
        visualState: 'default',
    },
    argTypes: {
        onToggle: { action: 'toggle' },
        imageBackground: { control: 'color' },
        tone: {
            control: 'inline-radio',
            options: ['claimed', 'pending', 'canceled'],
        },
        visualState: {
            control: 'inline-radio',
            options: ['default', 'hover'],
        },
    },
} satisfies Meta<typeof TransactionHistoryItem>

export default meta
type Story = StoryObj<typeof meta>

export const Compact: Story = {}

export const Expanded: Story = {
    args: {
        expanded: true,
    },
}

export const Hover: Story = {
    args: {
        visualState: 'hover',
    },
}

export const Interactive: Story = {
    render: function InteractiveStory(args) {
        const [expanded, setExpanded] = useState(false)

        return (
            <TransactionHistoryItem
                {...args}
                expanded={expanded}
                onToggle={() => setExpanded((current) => !current)}
            />
        )
    },
}

export const List: Story = {
    render: function ListStory(args) {
        const [expandedRow, setExpandedRow] = useState<number | null>(null)
        const transactions = [
            {
                retailerName: 'AliExpress',
                date: '05/08/2026',
                amount: '0.021 SOL',
                status: 'Claimed',
                tone: 'claimed' as const,
                imageSrc: aliexpressLogo,
            },
            {
                retailerName: 'Booking.com',
                date: '02/08/2026',
                amount: '0.034 SOL',
                status: 'In 4 days',
                tone: 'pending' as const,
                imageSrc: aliexpressLogo,
            },
            {
                retailerName: 'Total claims',
                date: '28/07/2026',
                amount: '0.018 SOL',
                status: 'Canceled',
                tone: 'canceled' as const,
                imageSrc: '/NIGHTLY/icons/dark/gift.svg',
                imageBackground: '#3D5AEB',
                imageFit: 'contain' as const,
            },
        ]

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transactions.map((transaction, index) => (
                    <TransactionHistoryItem
                        {...args}
                        {...transaction}
                        key={`${transaction.retailerName}-${transaction.date}`}
                        expanded={expandedRow === index}
                        onToggle={() => setExpandedRow((current) => current === index ? null : index)}
                    />
                ))}
            </div>
        )
    },
}

export const Pending: Story = {
    args: {
        amount: '0.034 SOL',
        status: 'In 4 days',
        tone: 'pending',
    },
}

export const Canceled: Story = {
    args: {
        amount: '0.021 SOL',
        status: 'Canceled',
        tone: 'canceled',
    },
}
