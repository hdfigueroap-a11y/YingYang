// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
// Desactiva las reglas de estilo de ESLint que compiten con Prettier
// (espaciado, comillas, etc.) — Prettier manda en formato, ESLint en
// correctitud/calidad. Debe ir al final para pisar cualquier regla de
// estilo que expoConfig haya activado antes.
const prettierConfig = require('eslint-config-prettier');
// `globals` ya viene como dependencia transitiva de ESLint — se reusa acá
// en vez de instalar eslint-plugin-jest solo para declarar los globals
// (`test`, `expect`, `describe`, `jest`) que jest-expo inyecta en los
// archivos *.test.js.
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    // .claude/worktrees/* son checkouts de otras sesiones/ramas de
    // trabajo, no código de este proyecto — lintearlos produce errores de
    // imports que no corresponden a los archivos reales de esta rama.
    ignores: ['dist/*', '.claude/**'],
  },
]);
