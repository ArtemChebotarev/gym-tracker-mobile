// https://docs.expo.dev/develop/unit-testing/
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@react-native/jest-preset/jest/setup.js',
    '<rootDir>/jest.setup.ts',
  ],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/domain/$1',
    '^@usecases/(.*)$': '<rootDir>/usecases/$1',
    '^@repositories/(.*)$': '<rootDir>/repositories/$1',
    '^@storage/(.*)$': '<rootDir>/storage/$1',
    '^@design/(.*)$': '<rootDir>/design/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@state/(.*)$': '<rootDir>/state/$1',
  },
  testPathIgnorePatterns: ['/node_modules/'],
};
