import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import * as path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    base: '/',
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            injectRegister: false,
            manifest: false,
            injectManifest: {
                globPatterns: [],
                additionalManifestEntries: [
                    { url: '/offline.html', revision: null },
                ],
            },
        }),
        svgr({
            svgrOptions: {
                plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
                svgoConfig: {
                    //floatPrecision: 2
                },
            },
            include: '**/*.svg?react', //! include the svg file for optimization by prefixing ?react
        }),
    ],
    //? add alias
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/'),
            '@admin': path.resolve(__dirname, 'src/admin'),
            '@adminComponents': path.resolve(__dirname, 'src/admin/components'),
            '@adminAssets': path.resolve(__dirname, 'src/admin/assets'),
            '@adminUtils': path.resolve(__dirname, 'src/admin/utils'),
            '@adminHooks': path.resolve(__dirname, 'src/admin/hooks'),
            '@adminServices': path.resolve(__dirname, 'src/admin/services'),
            '@adminStyles': path.resolve(__dirname, 'src/admin/styles'),
            '@adminRoutes': path.resolve(__dirname, 'src/admin/routes'),
            '@adminContext': path.resolve(__dirname, 'src/admin/context'),
            '@adminLayouts': path.resolve(__dirname, 'src/admin/layouts'),
            '@adminPages': path.resolve(__dirname, 'src/admin/pages'),
            '@adminApi': path.resolve(__dirname, 'src/admin/api'),
            '@adminTypes': path.resolve(__dirname, 'src/admin/types'),
            '@adminConfig': path.resolve(__dirname, 'src/admin/config'),
            '@adminConstants': path.resolve(__dirname, 'src/admin/constants'),
        },
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
                    'vendor-query':    ['@tanstack/react-query', '@reduxjs/toolkit', 'react-redux', 'redux-persist'],
                    'vendor-ui':       ['react-bootstrap', '@headlessui/react', 'react-datepicker', 'react-hot-toast'],
                    'vendor-charts':   ['apexcharts', 'react-apexcharts'],
                    'vendor-grapesjs': ['grapesjs', 'grapesjs-preset-newsletter'],
                    'vendor-tiptap':   ['@tiptap/react', '@tiptap/starter-kit'],
                    'vendor-pdf':      ['jspdf', 'html2canvas', 'html2pdf.js'],
                    'vendor-realtime': ['pusher-js', 'laravel-echo', '@laravel/echo-react'],
                },
            },
        },
    },
    // server: {
    //     host: '0.0.0.0',
    //     port: 5173,
    //     // host: 'frontend.swiftflitz.test',
    //     // strictPort: true,

    //     // open: true,
    // }
});
