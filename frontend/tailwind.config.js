/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef0ff', 100: '#dfe3ff', 200: '#c5ccff', 300: '#a3adff',
          400: '#8992f9', 500: '#7278ef', 600: '#5b5bd6', 700: '#4c49b5',
          800: '#3d3b90', 900: '#302e68', 950: '#1f1d40'
        },
        gray: {
          50: '#f7f8fa', 100: '#eef0f3', 200: '#e1e3e8', 300: '#ccd0d8',
          400: '#8a909c', 500: '#68707e', 600: '#515968', 700: '#353c49',
          800: '#242a35', 900: '#181c25', 950: '#111318'
        },
        accent: {
          50: '#f7f8fa', 100: '#eef0f3', 200: '#e1e3e8', 300: '#ccd0d8',
          400: '#8a909c', 500: '#68707e', 600: '#515968', 700: '#353c49',
          800: '#242a35', 900: '#181c25', 950: '#111318'
        },
        dark: {
          50: '#f5f5f6', 100: '#ededef', 200: '#d5d7dc', 300: '#b4b8c2',
          400: '#969ba7', 500: '#747b88', 600: '#42464f', 700: '#2b2e35',
          800: '#1c1e23', 900: '#17181b', 950: '#111214'
        },
        surface: {
          canvas: 'var(--surface-canvas)', panel: 'var(--surface-panel)',
          sidebar: 'var(--surface-sidebar)', raised: 'var(--surface-raised)'
        }
      },
      fontFamily: {
        sans: ['Pretendard Variable', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      fontSize: {
        xs: ['12px', { lineHeight: '18px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }]
      },
      boxShadow: {
        glass: 'none', 'glass-sm': 'none', glow: 'none', 'glow-lg': 'none',
        card: 'none', 'card-hover': 'none', 'inner-glow': 'none'
      },
      backgroundImage: {
        'gradient-primary': 'none', 'gradient-dark': 'none',
        'gradient-glass': 'none', 'mesh-gradient': 'none'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.25)' },
          '100%': { boxShadow: '0 0 30px rgba(20, 184, 166, 0.4)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
