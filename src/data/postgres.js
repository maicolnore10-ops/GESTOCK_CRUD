const { Pool } = require('pg');

const pool = new Pool({
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Error en una conexión de PostgreSQL:', error.message);
});

module.exports = pool;