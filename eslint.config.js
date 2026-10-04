/**
 * ESLint flat config (ESLint 9+).
 * Deliberately dependency-free: only `eslint` itself is required, so CI
 * never has to resolve extra config packages.
 */
module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        exports: "writable",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        // Jest
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      // Express handlers legitimately take unused (req, res, next) params
      // in order, and error middleware must keep all four for arity.
      "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^_" }],
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
    },
  },
  {
    ignores: ["node_modules/**", "coverage/**"],
  },
];
