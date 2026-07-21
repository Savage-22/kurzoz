import js from '@eslint/js'
import globals from 'globals'

export default [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: {
            // Los error handlers de Express necesitan la firma (err, req, res, next)
            // aunque no usen todos los argumentos
            'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$|^req$|^res$' }],
        },
    },
    {
        ignores: ['node_modules/'],
    },
]
