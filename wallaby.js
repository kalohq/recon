module.exports = function() {
  return {
    testFramework: 'jest',
    files: [
      'packages/**/src/**/*.js',
      {pattern: 'packages/**/src/**/__tests__/**/*.test.js', ignore: true},
    ],
    tests: [
      'packages/**/src/**/__tests__/**/*.test.js',
      {pattern: 'packages/**/node_modules/**/__tests__/**', ignore: true},
    ],
    env: {
      type: 'node',
      runner: 'node',
    },
    workers: {
      recycle: true,
    },
    filesWithNoCoverageCalculated: ['**/node_modules/**'],
    debug: true,
  };
};
