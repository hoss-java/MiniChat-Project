const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
    }],
  },
  moduleNameMapper: {
    '^react-router-dom$': '<rootDir>/mocks/react-router-dom.ts',
    '\\.(css|less|scss|sass)$': '<rootDir>/mocks/styleMock.js',
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/mocks/fileMock.js',
  },
};



