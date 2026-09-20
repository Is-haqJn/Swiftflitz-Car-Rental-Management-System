import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import * as path from 'path';
import tailwindcss from '@tailwindcss/vite';
import vitePrerenderer from '@prerenderer/rollup-plugin';
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    base: mode === 'production' ? '/' : '/',
    plugins: [
        react(),
        tailwindcss(),
        svgr({
            svgrOptions: {
                plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
                svgoConfig: {
                    //floatPrecision: 2
                },
            },
            include: '**/*.svg?react', //! include the svg file for optimization by prefixing ?react
        }),
        //* Prerendering configuration
        vitePrerenderer({
            routes: [
                '/',
                '/about',
                '/contact',
                '/auth/login',
                '/auth/register',
                '/403',
                '/404',
            ],
            renderer: new PuppeteerRenderer({
                renderAfterDocumentEvent: 'render-snap',
                headless: true,
                timeout: 10000, // 10 seconds
            }),
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
}));
