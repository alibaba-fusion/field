module.exports = {
  injectBabel: 'runtime',
  publicPath: './',
  plugins: [
    ['ice-plugin-fusion', {}],
    'ice-plugin-component',
  ],
  chainWebpack: (config, { command }) => {
    // 内置 jsx 和 tsx 规则均会使用到 babel 配置
    ['jsx', 'tsx'].forEach((rule) => {
      config.module
        .rule(rule)
        .use('babel-loader')
        .tap((options) => {
          // 添加一条 babel plugin，同理可添加 presets
          options.plugins.push(require.resolve('babel-plugin-transform-jsx-list'));
          options.plugins.push(require.resolve('babel-plugin-transform-react-es6-displayname'));
          options.plugins.push(require.resolve('babel-plugin-transform-object-assign'));
          options.plugins.push(require.resolve('babel-plugin-transform-proto-to-assign'));

          return options;
        });
    });
  }
};
