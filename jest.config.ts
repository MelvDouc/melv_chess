import { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: [".ts"],
  testPathIgnorePatterns: ["/node_modules"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@([^\\/]+)/(.+)\\.js": "<rootDir>/src/$1/$2.ts"
  },
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true
      },
    ],
  },
};

export default config;