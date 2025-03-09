import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$app: path.resolve('node_modules/@sveltejs/kit/src/runtime/app'),
			$lib: path.resolve('src/lib'),
		},
	},
});
