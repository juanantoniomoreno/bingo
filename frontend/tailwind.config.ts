import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wood-light': 'rgb(210 180 140 / <alpha-value>)',
        'wood-medium': 'rgb(196 168 130 / <alpha-value>)',
        'wood-dark': 'rgb(92 68 13 / <alpha-value>)',
        'metal-light': 'rgb(212 212 216 / <alpha-value>)',
        'metal-mid': 'rgb(161 161 170 / <alpha-value>)',
        'metal-dark': 'rgb(82 82 91 / <alpha-value>)',
        'ball-red': 'rgb(220 38 38 / <alpha-value>)',
        'ball-blue': 'rgb(37 99 235 / <alpha-value>)',
        'ball-green': 'rgb(21 128 61 / <alpha-value>)',
        'ball-yellow': 'rgb(180 83 9 / <alpha-value>)',
        'ball-orange': 'rgb(194 65 12 / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;