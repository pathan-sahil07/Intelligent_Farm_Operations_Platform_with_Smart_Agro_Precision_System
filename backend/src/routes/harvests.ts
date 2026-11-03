import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM harvest_records ORDER BY harvest_date DESC, id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
