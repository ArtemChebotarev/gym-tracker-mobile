// https://docs.expo.dev/develop/unit-testing/
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/domain/$1',
    '^@usecases/(.*)$': '<rootDir>/usecases/$1',
    '^@repositories/(.*)$': '<rootDir>/repositories/$1',
    '^@storage/(.*)$': '<rootDir>/storage/$1',
    '^@design/(.*)$': '<rootDir>/design/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/__boundary-fixtures__/'],
};
