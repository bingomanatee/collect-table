module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.eslint.json',
    createDefaultProgram: true,
    sourceType: 'module',
    tsconfigRootDir: __dirname
  },
  "settings": {
    "import/resolver": {
      "node": {
        "paths": ["src"],
        "extensions": [".js", ".jsx", ".ts", ".tsx"],
      }
    },
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    "eslint:recommended",
    "airbnb",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: ['.eslintrc.js', "types/types.d.ts"],
  rules: {
    "import/extensions": "off",
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "@typescript-eslint/no-this-alias": "off",
    "no-underscore-dangle": "off",
    "@typescript-eslint/no-var-requires": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "class-methods-use-this": "off",
    "import/prefer-default-export": "warn",
    "no-shadow": "off",
    "@typescript-eslint/no-shadow" : 2,
    "no-use-before-define": "warn"
  },
};
