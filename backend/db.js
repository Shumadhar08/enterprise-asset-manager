const { Pool } = require('pg');
require('dotenv').config(); // This line reads your .env file

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
  // We removed the SSL block here so it works perfectly on your local machine!
});

pool.connect()
  .then(() => console.log('Successfully connected to the PostgreSQL database!'))
  .catch((err) => console.error('Database connection error:', err.stack));

module.exports = pool;