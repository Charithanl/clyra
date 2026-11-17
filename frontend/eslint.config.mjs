import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  eslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" } },
    plugins: { "@next/next": nextPlugin, "@typescript-eslint": tsPlugin },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs["core-web-vitals"].rules, ...tsPlugin.configs.recommended.rules, "no-undef": "off", "no-unused-vars": "off", "no-redeclare": "off", "@typescript-eslint/no-unused-vars": "off", "@typescript-eslint/no-redeclare": "off", "@typescript-eslint/ban-ts-comment": "off", "@typescript-eslint/triple-slash-reference": "off" },
  },
];
