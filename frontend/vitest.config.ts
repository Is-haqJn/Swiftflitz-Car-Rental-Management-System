import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import * as path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/'),
            '@admin': path.resolve(__dirname, 'src/admin'),
            '@adminComponents': path.resolve(__dirname, 'src/admin/components'),
            '@adminUtils': path.resolve(__dirname, 'src/admin/utils'),
            '@adminServices': path.resolve(__dirname, 'src/admin/services'),
            '@adminAssets': path.resolve(__dirname, 'src/admin/assets'),
            '@adminHooks': path.resolve(__dirname, 'src/admin/hooks'),
            '@adminStyles': path.resolve(__dirname, 'src/admin/styles'),
            '@adminConfig': path.resolve(__dirname, 'src/admin/config'),
            '@adminTypes': path.resolve(__dirname, 'src/admin/types'),
            '@adminContext': path.resolve(__dirname, 'src/admin/context'),
            '@adminRoutes': path.resolve(__dirname, 'src/admin/routes'),
            '@adminLayouts': path.resolve(__dirname, 'src/admin/layouts'),
            '@adminPages': path.resolve(__dirname, 'src/admin/pages'),
            '@adminStore': path.resolve(__dirname, 'src/admin/store'),
            '@adminApi': path.resolve(__dirname, 'src/admin/api'),
            '@adminConstants': path.resolve(__dirname, 'src/admin/constants'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
});
