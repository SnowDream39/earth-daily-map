import { defineConfig, presetWind4, presetIcons } from 'unocss'
import { presetDaisy } from '@ameinhardt/unocss-preset-daisy'

export default defineConfig({
  presets: [
    presetDaisy(),
    presetIcons(),
    presetWind4({
      dark: 'media',
    }),
  ],
  safelist: [
    'dark:bg-yellow-800',
    'dark:text-white',
    'translate-x-0',
    '-translate-x-full',
    'border-gray-300',
    'border-lime-400',
    'ring-line-400',
    'shadow-lime-500/30',
    'i-material-symbols-thumb-up',
    'i-material-symbols-thumb-up-outline',
    'i-material-symbols-thumb-down',
    'i-material-symbols-thumb-down-outline',
    'i-material-symbols-reply',
    'i-material-symbols-share',
  ],
  shortcuts: [
    ['bg-paper', 'bg-zinc-100 dark:bg-zinc-700!'],
    ['bg-paper-heavy', 'bg-zinc-200 dark:bg-zinc-800!'],
    [
      'input-style',
      'border border-gray-300 dark:border-lime-400 rounded px-2 py-1 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-lime-400;',
    ],
  ],
  content: {
    pipeline: {
      include: ['src/**/*.{vue,ts,js}'],
    },
  },
})
