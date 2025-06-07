import { defineConfig, presetWind4 } from 'unocss'
import { presetDaisy } from '@ameinhardt/unocss-preset-daisy'

export default defineConfig({
  presets: [
    presetDaisy(),
    presetWind4({
      dark: 'media',
    }),
  ],
  safelist: ['dark:bg-yellow-800', 'dark:text-white', 'translate-x-0', '-translate-x-full'],
  content: {
    pipeline: {
      include: ['src/**/*.{vue,ts,js}'],
    },
  },
})
