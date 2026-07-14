import type { Preview } from '@storybook/react-vite'
import '../src/globals.css'

const preview: Preview = {
    parameters: {
        backgrounds: {
            default: 'Nightly',
            values: [
                { name: 'Nightly', value: '#0F0F1A' },
                { name: 'Surface', value: '#171C2F' },
            ],
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        options: {
            storySort: {
                order: ['Nightly', '*'],
            },
        },
    },
    tags: ['autodocs'],
}

export default preview
