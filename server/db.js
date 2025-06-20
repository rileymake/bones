const { Pool } = require('pg');
const config = require('../config.json');

const dbConfig = config.DB;

const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

module.exports = pool;
