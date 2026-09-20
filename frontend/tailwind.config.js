/** @type {import('tailwindcss').Config} */
export default {
    prefix: 'tw',
    //important: true,
    content: ['./src/**/*.{html,js,jsx,ts,tsx,vue}', './public/index.html'],
    theme: {
        extend: {
            colors: {
                primary: '#126dff',
                secondary: '#00203f',
                tertiary: '#c83200',
            },
        },
    },
    plugins: [],
};
