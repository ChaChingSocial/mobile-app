const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");

config.resolver.unstable_enablePackageExports = false; // Fix for Error: Component auth has not been registered yet, js engine: hermes
// config.resolver.unstable_enableSymlinks = false;

module.exports = withNativeWind(config, { input: "./global.css" });
