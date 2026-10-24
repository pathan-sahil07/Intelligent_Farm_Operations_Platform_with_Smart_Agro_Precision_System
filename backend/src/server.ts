import 'dotenv/config';
import app from './app';
import { pool } from './db';

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');

    app.listen(port, () => {
      console.log(`Farm API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
}

void start();
