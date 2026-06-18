import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        hospital: resolve(__dirname, 'hospital.html'),
        directory: resolve(__dirname, 'jyothi/directory.html'),
      },
    },
  },
});
