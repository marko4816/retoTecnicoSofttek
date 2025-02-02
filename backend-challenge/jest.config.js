
module.exports = {
  preset: "@shelf/jest-dynamodb",
    testEnvironment: "node",
    globalSetup: require.resolve("@shelf/jest-dynamodb/lib/setup"),
    globalTeardown: require.resolve("@shelf/jest-dynamodb/lib/teardown"),
    testMatch: ["**/tests/**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json"],
    clearMocks: true
  };
  
