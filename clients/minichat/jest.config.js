const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/mocks/styleMock.js',
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/mocks/fileMock.js',
  },
};
