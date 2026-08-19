// Learn more: https://docs.expo.dev/versions/latest/config/babel/
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // Drizzle's generated `migrations.js` imports each `.sql` file. Metro cannot
    // read one as a string on its own, so inline the contents at build time.
    // `babel-preset-expo` still supplies the worklets plugin and the React
    // Compiler, so listing it here keeps both working.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
