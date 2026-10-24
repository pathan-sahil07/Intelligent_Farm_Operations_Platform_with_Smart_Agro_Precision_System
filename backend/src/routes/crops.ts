import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM crops ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      name, variety, field_name, area_acres, planting_date,
      expected_harvest_date, growth_stage, notes,
    } = req.body ?? {};

    if (!name || !field_name || !area_acres || !planting_date) {
      res.status(400).json({
        error: 'name, field_name, area_acres and planting_date are required',
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO crops
        (name, variety, field_name, area_acres, planting_date,
         expected_harvest_date, growth_stage, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        name, variety ?? null, field_name, area_acres, planting_date,
        expected_harvest_date || null, growth_stage || 'Seedling', notes ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/stage', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { growth_stage } = req.body ?? {};
    const allowed = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature'];

    if (!Number.isInteger(id) || id < 1 || !allowed.includes(growth_stage)) {
      res.status(400).json({ error: 'Valid crop ID and growth_stage are required' });
      return;
    }

    const result = await pool.query(
      'UPDATE crops SET growth_stage = $1 WHERE id = $2 RETURNING *',
      [growth_stage, id]
    );

    if (!result.rowCount) {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/harvest', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const id = Number(req.params.id);
    const { harvest_date, quantity_kg, quality, notes } = req.body ?? {};

    if (
      !Number.isInteger(id) || id < 1 || !harvest_date ||
      quantity_kg === undefined || !Number.isFinite(Number(quantity_kg)) ||
      Number(quantity_kg) < 0
    ) {
      res.status(400).json({
        error: 'Valid crop ID, harvest_date and non-negative quantity_kg are required',
      });
      return;
    }

    await client.query('BEGIN');

    const crop = await client.query(
      "SELECT id, name FROM crops WHERE id = $1 AND status = 'Active' FOR UPDATE",
      [id]
    );

    if (!crop.rowCount) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Active crop not found' });
      return;
    }

    const harvest = await client.query(
      `INSERT INTO harvest_records
        (crop_id, crop_name, harvest_date, quantity_kg, quality, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, crop.rows[0].name, harvest_date, quantity_kg, quality ?? null, notes ?? null]
    );

    await client.query(
      "UPDATE crops SET status = 'Harvested' WHERE id = $1",
      [id]
    );

    await client.query('COMMIT');
    res.status(201).json(harvest.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    next(error);
  } finally {
    client.release();
  }
});

export default router;
