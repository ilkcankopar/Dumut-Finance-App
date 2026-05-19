const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('glb', 'gltf', 'bin');

const mockModules = {
  'react-native-reanimated': path.resolve(__dirname, 'src/utils/reanimated-mock.ts'),
  'moti': path.resolve(__dirname, 'src/utils/moti-mock.ts'),
  'react-native-worklets': path.resolve(__dirname, 'src/utils/worklets-mock.ts'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (mockModules[moduleName]) {
    return {
      filePath: mockModules[moduleName],
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
