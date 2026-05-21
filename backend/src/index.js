import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import eventsRouter from './routes/events.js';

const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      'https://operative-kohl.vercel.app',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/events', eventsRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
