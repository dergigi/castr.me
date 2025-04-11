/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dce3fd',
          300: '#c3cffc',
          400: '#a5b4fa',
          500: '#8293f8',
          600: '#5668f5',
          700: '#3d4de0',
          800: '#3240bd',
          900: '#2f3a98',
        },
      },
      typography: theme => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            a: {
              color: theme('colors.brand.600'),
              '&:hover': {
                color: theme('colors.brand.800'),
              },
            },
            h1: {
              color: theme('colors.gray.900'),
              fontWeight: '700',
            },
            h2: {
              color: theme('colors.gray.900'),
              fontWeight: '600',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
} 