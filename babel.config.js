// Expo's own defaults plus one plugin. Drizzle's generated `drizzle/migrations.js` imports the
// `.sql` files next to it so the bundler carries them into the app (task 069), and without
// `inline-import` Babel would try to parse SQL as JavaScript — Metro hands every source
// extension it knows to the same transformer. The plugin replaces each such import with the
// file's contents as a string instead, which is exactly what the migration runner expects.
//
// See metro.config.js for the other half: Metro has to be told `.sql` is a source extension at
// all before it reaches Babel.
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
