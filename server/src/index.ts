import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import userRouter from './routes/userRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', userRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
