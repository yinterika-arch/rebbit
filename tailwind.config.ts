import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A6741',
          light: '#5E8254',
          dark: '#3A5233',
        },
        secondary: {
          DEFAULT: '#7A6552',
          light: '#9A8270',
        },
        danger: '#B84040',
        warn: '#B87840',
        bg: '#F5F3F0',
        card: '#FFFFFF',
        border: '#E0DCD7',
        muted: '#6B6660',
      },
      fontSize: {
        base: ['18px', '1.6'],
        sm: ['15px', '1.5'],
        xs: ['13px', '1.4'],
        lg: ['20px', '1.5'],
        xl: ['24px', '1.3'],
        '2xl': ['28px', '1.2'],
      },
      minHeight: {
        touch: '56px',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}

export default config
