import { defineConfig } from 'cypress';

export default defineConfig({
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
        },
        specPattern: ['test/**/*.spec.{ts,tsx}'],
        viewportWidth: 1000,
        viewportHeight: 600,
    },
});
