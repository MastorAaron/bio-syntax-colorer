import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    rootDir: ".",
    testEnvironment: 'node',
    roots: [ 
        '<rootDir>/src',
        '<rootDir>/__tests__'
    ],
   transform: { '^.+\\.[jt]sx?$': ['ts-jest', {
            tsconfig: './tsconfig.json',
        }]
    },
    moduleFileExtensions: ['ts','js', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    globals: {
        
    },
};

export default config;
