const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");

config.resolver.unstable_enablePackageExports = false; // Fix for Error: Component auth has not been registered yet, js engine: hermes
// config.resolver.unstable_enableSymlinks = false;
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@privy-io/")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: true,
    };

    if (defaultResolveRequest) {
      return defaultResolveRequest(ctx, moduleName, platform);
    }

    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
