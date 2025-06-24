export default { 
  preset: 'ts-jest',
  testEnvironment: 'node',
  "testPathIgnorePatterns": ["/extension.js"],
    moduleDirectories: [
      "node_modules",
      "__tests__/__mocks__"
    ]
};