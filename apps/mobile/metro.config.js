const { getDefaultConfig } = require("expo/metro-config");

// SDK 57's dev serializer needs SQLite's worker in the graph even when it is
// an async dependency. Lazy graphs omit it and fail with "Worker chunk not found".
process.env.EXPO_NO_METRO_LAZY = "1";

// Expo configures workspace paths and nested dependency resolution automatically.
const config = getDefaultConfig(__dirname);

const expoSerializer = config.serializer.customSerializer;
config.serializer.customSerializer = (entryPoint, preModules, graph, options) =>
  expoSerializer(entryPoint, preModules, graph, {
    ...options,
    // Keep dev worker URLs even though the complete graph is loaded above.
    includeAsyncPaths:
      options.includeAsyncPaths || (options.dev && graph.transformOptions.platform === "web"),
  });

// expo-sqlite uses WebAssembly and SharedArrayBuffer in the browser.
config.resolver.assetExts.push("wasm");
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  return middleware(req, res, next);
};

module.exports = config;
