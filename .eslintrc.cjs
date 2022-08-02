module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  "parser": "@typescript-eslint/parser",
  extends: [
    'standard'
  ],
  parserOptions: {
    "ecmaFeatures": {
      "jsx": true
    },
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'prefer-destructuring': 'warn',
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'semi': [1, 'always'],
    'comma-dangle': [1]
  }
};
