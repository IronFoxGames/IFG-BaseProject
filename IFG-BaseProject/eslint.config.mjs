import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
    {
        ignores: ['**/temp/*', '**/build/*', '**/library/*', '**/node_modules/*', '**/thirdParty/*', '**/extensions/*']
    },
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'], // Include TypeScript files
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './ci/tsconfig.json'
            }
        },
        plugins: {
            'unused-imports': unusedImports,
            '@typescript-eslint': ts
        },
        rules: {
            ...ts.configs.recommended.rules,
            'no-unused-vars': 'off',
            'no-undef': 'off', // 'no-undef' is not compatible with TypeScript
            'no-redeclare': 'off',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-explicit-any': 'warn', // warn until we get our `any` under control
            '@typescript-eslint/no-unused-vars': 'off', //['warn', { argsIgnorePattern: '^_' }]
            // Enable fixable unused-import rules:
            'unused-imports/no-unused-imports': 'warn',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_'
                }
            ]
        }
    }
];
