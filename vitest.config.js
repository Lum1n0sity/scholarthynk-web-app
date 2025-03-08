// vitest.config.js
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.js'],
        mockReset: true,
        restoreMocks: true,
    },
    resolve: {
        alias: {
            $lib: path.resolve('./src/lib'),
            '$lib/js/home': path.resolve('./src/lib/js/home'), // Specific alias
            $src: path.resolve('./src'),
        },
        conditions: ['browser', 'development'],
    },
    define: {
        'import.meta.vitest': 'undefined',
    },
    hook: {
        'config:resolved': (config) => {
            console.log('Vitest Resolve Alias:', config.resolve.alias);
        },
    },
});