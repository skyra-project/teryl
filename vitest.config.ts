import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: [
			{ find: '#lib', replacement: resolve('src/lib') },
			{ find: '#generated', replacement: resolve('src/generated') }
		]
	},
	test: {
		globals: true,
		coverage: {
			reporter: ['text', 'lcov', 'clover'],
			include: [resolve('src/lib')]
		}
	},
	esbuild: {
		target: 'es2022'
	}
});