// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*'],
  },
  {
    rules: {
      // HTML-entity escaping guards web JSX; React Native <Text> renders apostrophes literally.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['__tests__/**'],
    languageOptions: { globals: { jest: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly', afterEach: 'readonly' } },
  },
]);
