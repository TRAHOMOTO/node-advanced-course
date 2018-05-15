const clearHash = require('../services/cache').clearHash;

module.exports = function (keyProvider) {

  if (typeof keyProvider !== 'function') {
    throw new Error('Cache key provider is not a function!');
  }

  return async (req, res, next) => {
    await next();

    if(res.statusCode < 400) {
      const cacheKey = keyProvider(req, res);
      console.log('Cleaning cache for::: ', cacheKey);
      clearHash(cacheKey);
    }
  }
};
