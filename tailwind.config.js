/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    blue: '#1e40af',
                    indigo: '#4338ca',
                    purple: '#7c3aed',
                },
                accent: {
                    emerald: '#059669',
                    teal: '#0d9488',
                    red: '#dc2626',
                    orange: '#ea580c',
                },
                neutral: {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                shake: 'shake 0.5s ease-in-out',
                'bounce-slow': 'bounce 2s infinite',
                float: 'float 3s ease-in-out infinite',
                lift: 'lift 0.2s ease',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                lift: {
                    '0%': { transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
                    '100%': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
                },
            },
        },
    },
    plugins: [],
};
