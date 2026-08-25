// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // jest.mock() calls must appear before other imports in source order
    // for babel-plugin-jest-hoist to hoist them correctly, and mock
    // factories intentionally use require() to defer loading react-native
    // until the mock is actually invoked.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/first': 'off',
    },
  },
])
