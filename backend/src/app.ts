import express from 'express';
import cors from 'cors';
import cropsRouter from './routes/crops';
import irrigationRouter from './routes/irrigation';
import harvestsRouter from './routes/harvests';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'intelligent-farm-backend' });
});

app.use('/api/crops', cropsRouter);
app.use('/api/irrigation', irrigationRouter);
app.use('/api/harvests', harvestsRouter);

app.use((
  error: Error,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  console.error(error.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
