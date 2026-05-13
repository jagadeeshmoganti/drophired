const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use('/adzuna', createProxyMiddleware({
    target: 'https://api.adzuna.com',
    changeOrigin: true,
    pathRewrite: { '^/adzuna': '' },
  }));
};
