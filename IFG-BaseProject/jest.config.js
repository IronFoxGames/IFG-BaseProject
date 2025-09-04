module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.ts'], // Define the test folder
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/assets/scripts/$1', // Map paths to your scripts folder
        'cc/env': '<rootDir>/tests/ccenv.ts'
    }
};
