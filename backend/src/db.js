const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'securepulse',
  user: process.env.POSTGRES_USER || 'securepulse',
  password: process.env.POSTGRES_PASSWORD || 'localdevpassword',
});
pool.on('error', (err) => console.error('PostgreSQL error:', err.message));
module.exports = { query: (text, params) => pool.query(text, params), pool };
