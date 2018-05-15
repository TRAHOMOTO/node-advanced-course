const redisURI = require('../config/keys').redisURI;
const mongoose = require('mongoose');
const redis = require('redis');
const redisClient = redis.createClient(redisURI);

const {promisify} = require('util');

redisClient.hget = promisify(redisClient.hget);

const exec = mongoose.Query.prototype.exec;


mongoose.Query.prototype.cache = function (options = {}) {
  this._isCachedByRedis = true;
  this._redisTopHashKey = JSON.stringify(options.key || '');
  return this;
};

mongoose.Query.prototype.exec = async function (...args) {

  if (!this._isCachedByRedis) {
    return exec.apply(this, args);
  }

  const collection = this.mongooseCollection.name;
  const query = this.getQuery();

  if (process.env.NODE_ENV !== 'production') {
    console.log('Use Redis cache', collection, query);
  }

  const key = toJSON({collection, ...query});

  try {

    const cached = await redisClient.hget(this._redisTopHashKey, key);

    if (!!cached) {

      const cachedData = fromJSON(cached);

      return Array.isArray(cachedData)
        ? cachedData.map(doc => new this.model(doc))
        : new this.model(cachedData);
    }

  } catch (e) {
    console.error('Cache read error::: ', e);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('EXEC QUERY', collection, query);
  }

  const fromDB = await exec.apply(this, args);

  if (fromDB) {

    try {
      redisClient.hset(this._redisTopHashKey, key, toJSON(fromDB));
      redisClient.expire(this._redisTopHashKey, 60)
    } catch (e) {
      console.error('Cache write error::: ', e);
    }
  }

  return fromDB;
};

function toJSON(str) {
  return JSON.stringify(str);
}

function fromJSON(obj) {
  return JSON.parse(obj);
}

module.exports.clearHash = function(hashKey){
  if (process.env.NODE_ENV !== 'production') {
    console.log('Delete in Redis cache', hashKey);
  }
  redisClient.del(JSON.stringify(hashKey))
};