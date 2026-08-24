import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // supabase/functions is Deno runtime code (Deno.serve, Deno.env, npm:/
  // jsr: specifiers) — a different toolchain entirely from this project's
  // browser/vite-node target, just like it's excluded from tsconfig.app.json
  // and tsconfig.node.json's `include`. Linting it against globals.browser
  // would flag every Deno global as undefined.
  // apps/mobile is a separate Expo/React Native workspace with its own
  // eslint-config-expo setup (its own flat config, its own `npm run lint`
  // via --workspace=apps/mobile) — this config's globals.browser and
  // Vite-specific react-refresh rules don't apply there, and ESLint's flat
  // config doesn't cascade across directories, so it must be excluded here
  // rather than relying on apps/mobile/eslint.config.js being picked up.
  globalIgnores(['dist', 'coverage', 'supabase/functions/**', 'apps/mobile/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui-generated components — machine-generated, re-created by
    // `shadcn add`. They routinely export a hook/variants helper alongside
    // the component (e.g. buttonVariants, useFormField), which is the
    // standard shadcn pattern but trips react-refresh's single-export rule.
    files: ['src/presentation/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
