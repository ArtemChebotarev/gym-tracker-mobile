// Metro's defaults plus one addition: Drizzle's generated migrations are `.sql` files, and
// `drizzle/migrations.js` imports them so they land in the bundle — the app has no filesystem to
// read them from at runtime. Metro only bundles extensions it is told about (task 069).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

module.exports = config;
