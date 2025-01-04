const { Pool } = require('pg');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console()],
});

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'task_scheduler_db',
  password: process.env.PG_PASSWORD || 'root',
  port: process.env.PG_PORT || 5432,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    logger.error('Error acquiring a client from the pool', err);
    throw new Error('Could not acquire a client from the pool');
  }
};

const query = async (text, params) => {
  const client = await getClient();
  try {
    return await client.query(text, params);
  } catch (err) {
    logger.error('Query execution error', err);
    throw err;
  } finally {
    client.release();
  }
};

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

module.exports = { query };
