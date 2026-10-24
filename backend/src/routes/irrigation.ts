import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name AS crop_name
       FROM irrigation_schedules i
       JOIN crops c ON c.id = i.crop_id
       ORDER BY i.scheduled_date, i.scheduled_time`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      crop_id, scheduled_date, scheduled_time, water_liters, method, notes,
    } = req.body ?? {};

    if (
      !Number.isInteger(Number(crop_id)) || Number(crop_id) < 1 ||
      !scheduled_date || !Number.isFinite(Number(water_liters)) ||
      Number(water_liters) <= 0
    ) {
      res.status(400).json({
        error: 'crop_id, scheduled_date and positive water_liters are required',
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO irrigation_schedules
        (crop_id, scheduled_date, scheduled_time, water_liters, method, notes)
       SELECT id, $2, $3, $4, $5, $6
       FROM crops WHERE id = $1 AND status = 'Active'
       RETURNING *`,
      [crop_id, scheduled_date, scheduled_time || null, water_liters, method || 'Drip', notes ?? null]
    );

    if (!result.rowCount) {
      res.status(400).json({ error: 'Active crop not found for crop_id' });
      return;
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};

    if (
      !Number.isInteger(id) || id < 1 ||
      !['Scheduled', 'Completed', 'Skipped'].includes(status)
    ) {
      res.status(400).json({ error: 'Valid ID and status are required' });
      return;
    }

    const result = await pool.query(
      `UPDATE irrigation_schedules
       SET status = $1,
           completed_at = CASE WHEN $1 = 'Completed' THEN NOW() ELSE NULL END
       WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (!result.rowCount) {
      res.status(404).json({ error: 'Irrigation schedule not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
