import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths let this site work at GitHub Pages project URLs
  // such as https://USERNAME.github.io/FoodStall/ without renaming the repo.
  base: './',
  plugins: [react()],
})
