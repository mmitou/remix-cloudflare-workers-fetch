import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  testEnvironment: "miniflare",
};

export default config;
