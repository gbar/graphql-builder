module.exports = async () => {
  return {
    preset: 'ts-jest',
    modulePathIgnorePatterns: ['dist'],
    rootDir: './',
    testMatch: [
      '<rootDir>/**/*.test.{js,jsx,ts,tsx}',
    ],
  }
}
