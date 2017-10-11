const path = require('path');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const compression = require('compression');
const dllPlugin = require('./dllPlugin');

function createWebpackMiddleware(compiler, publicPath) {
  return webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath,
    silent: true,
    stats: 'errors-only',
  });
}

function dllPluginsMiddleware(req, res) {
  const filename = req.path.replace(/^\//, '');
  res.sendFile(path.join(process.cwd(), dllPlugin.path, filename));
}

module.exports = function addDevMiddlewares(app, webpackConfig, site) {
  app.use(compression());
  const fromDir = ['build', site].join('/');
  webpackConfig.plugins.push(new CopyWebpackPlugin([{ from: fromDir }]));
  const compiler = webpack(webpackConfig);
  const middleware = createWebpackMiddleware(compiler, webpackConfig.output.publicPath);

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));

  if (dllPlugin) {
    app.get(/\.dll\.js$/, dllPluginsMiddleware);
  }

  // Since webpackDevMiddleware uses memory-fs internally to store build
  // artifacts, we use it instead
  const fs = middleware.fileSystem;

  app.get('*', (req, res) => {
    fs.readFile(path.join(compiler.outputPath, 'index.html'), (err, file) => {
      if (err) {
        res.sendStatus(404);
      } else {
        res.send(file.toString());
      }
    });
  });
};
