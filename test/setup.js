jest.setTimeout(10000);

require('../models/User');

const mongoose = require('mongoose');
const { mongoURI } = require('../config/keys');

mongoose.Promise = global.Promise;

mongoose.set('debug', false);

mongoose.connect(mongoURI, {
  useMongoClient: true
});