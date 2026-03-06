import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default tseslint.config(
    // Global ignores
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.sql'],
    },

    // Base JS rules
    js.configs.recommended,

    // TypeScript rules
    ...tseslint.configs.recommended,

    // React Hooks + Prettier
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
            prettier: prettierPlugin,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2020,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            // React Hooks (fully ESLint v10 compatible)
            ...reactHooks.configs.recommended.rules,
            // Downgrade to warn – existing code uses setState in effects deliberately
            'react-hooks/set-state-in-effect': 'warn',

            // TypeScript
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': 'error',

            // Prettier (must be last)
            'prettier/prettier': 'warn',
        },
    },

    // Prettier disables conflicting ESLint style rules
    prettierConfig,
);
