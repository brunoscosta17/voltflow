/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                volt: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                lime: {
                    400: '#a3e635',
                    500: '#84cc16',
                },
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    800: '#1e293b',
                    850: '#172033',
                    900: '#0f172a',
                    950: '#080f1e',
                },
            },
            backgroundImage: {
                'volt-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                'dark-grid': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23334155' stroke-width='0.5'%3E%3Cpath d='M0 40L40 0M0 0l40 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            },
            boxShadow: {
                'glow-volt': '0 0 30px rgba(14,165,233,0.25)',
                'glow-lime': '0 0 20px rgba(163,230,53,0.3)',
                glass: '0 8px 32px rgba(0,0,0,0.4)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.4s ease-out',
            },
            keyframes: {
                slideIn: { from: { transform: 'translateX(-10px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
            },
        },
    },
    plugins: [],
};
