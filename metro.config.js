const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });

// Hermes rejects dynamic import() in release bundles. @supabase/supabase-js 2.106.x
// ships Hermes-safe CJS (require for optional OTEL); Metro must not use the ESM build.
const supabaseCjsEntry = path.resolve(
  __dirname,
  'node_modules/@supabase/supabase-js/dist/index.cjs',
);
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/supabase-js') {
    return { type: 'sourceFile', filePath: supabaseCjsEntry };
  }
  if (resolveRequest) {
    return resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
