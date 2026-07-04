import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".npm-cache/**",
      "cache/**",
      "lib/openzeppelin-contracts/**",
      "next-env.d.ts",
      "node_modules/**",
      "out/**"
    ]
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"]
  })
];

export default eslintConfig;
