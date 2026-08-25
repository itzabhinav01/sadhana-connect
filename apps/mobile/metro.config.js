const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Standard Expo monorepo setup: watch the workspace root so Metro picks up
// (and transforms) the TypeScript source in packages/*, which is reached
// through node_modules symlinks but physically lives outside this app.
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.disableHierarchicalLookup = true

// Expo Router treats every file under app/ as a potential route — exclude
// test files so Metro (and the router's route table) never picks them up.
// Appended to (not replacing) getDefaultConfig's own blockList.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList]),
  /\.test\.[jt]sx?$/,
]

module.exports = config
