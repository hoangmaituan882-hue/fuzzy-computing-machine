import { defineConfig } from 'vite'
import mdx from 'fumadocs-mdx/vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    mdx(),
    devtools(),
    tailwindcss(),
    tanstackStart({
      importProtection: {
        // auth.client.ts is isomorphic (guards window access internally);
        // allow server-side route files to import it.
        server: { excludeFiles: ['**/features/auth/auth.client.*'] },
      },
    }),
    viteReact(),
  ],
})

export default config
