
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],

    server: {
        proxy: {
            '/indiarestros-api': {
                target: 'https://indiarestros.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) =>
                    path.replace(/^\/indiarestros-api/, '/api/v1'),
            },
        },
    },
})
