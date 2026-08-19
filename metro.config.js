// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Import .svg files as React components instead of as static assets.
config.transformer.babelTransformerPath = require.resolve(
  'react-native-svg-transformer/expo'
);
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
// `.sql` joins the source extensions so Metro hands Drizzle's generated
// migrations to Babel, where `inline-import` turns them into strings.
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg', 'sql'];

module.exports = config;
