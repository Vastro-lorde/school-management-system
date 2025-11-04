const browserGlobals = {
  React: "readonly",
  JSX: "readonly",
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  fetch: "readonly",
  alert: "readonly",
  confirm: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  Request: "readonly",
  Response: "readonly",
  Headers: "readonly",
  FormData: "readonly",
  AbortController: "readonly",
  console: "readonly"
};

const nodeGlobals = {
  process: "readonly",
  module: "readonly",
  require: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  exports: "readonly",
  Buffer: "readonly",
  global: "readonly",
  console: "readonly"
};

const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "infra/**",
      "public/**",
      "scripts/**",
      "docs/**",
      "**/dist/**",
      "coverage/**",
      "src/server/db/**/*.mjs"
    ]
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...browserGlobals,
        ...nodeGlobals
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    },
    rules: {
      "array-callback-return": "error",
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-await-in-loop": "off",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-condition": "warn",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "warn",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-import-assign": "error",
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-new-symbol": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-promise-executor-return": "error",
      "no-prototype-builtins": "warn",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-use-before-define": "off",
      "no-useless-backreference": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": ["error", { requireStringLiterals: true }],
      "no-console": "off",
      "no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off"
    }
  }
];

export default config;
