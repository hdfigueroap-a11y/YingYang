// babel.config.js
// Necesario para react-native-reanimated (usado por @react-navigation/drawer
// para las animaciones del menú) — su plugin de Babel debe ir último en la
// lista, según la documentación oficial de Reanimated.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
