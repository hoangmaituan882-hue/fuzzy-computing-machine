import tsParser from '@typescript-eslint/parser'

export default [
  {
    // Apply our custom rules to all src TS/TSX files, using the TS parser
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'Environment access is centralized in src/lib/env.ts; import env from there.',
        },
      ],
    },
  },
  {
    files: ['src/lib/env.ts'],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
  {
    // Never lint generated or built files
    ignores: [
      'dist/**',
      '.wrangler/**',
      'drizzle/**',
      'worker-configuration.d.ts',
      'src/routeTree.gen.ts',
      'node_modules/**',
      'docs/**', // standalone docs app — has its own toolchain
    ],
  },
]
