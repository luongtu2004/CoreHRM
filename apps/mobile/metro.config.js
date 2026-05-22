const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the `node_modules` of the project root.
config.resolver.disableHierarchicalLookup = true;

// 4. Inject EXPO_ROUTER_APP_ROOT
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// IMPORTANT: Add this to fix the EXPO_ROUTER_APP_ROOT issue in monorepos
process.env.EXPO_ROUTER_APP_ROOT = 'app';

module.exports = config;
