import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import userRouter from './routes/userRoutes';
import matchRouter from './routes/matchRoutes';
import playerRouter from './routes/nhlPlayerRoutes';
import fantasyTeamRouter from './routes/fantasyTeamRoutes';
import leagueRouter from './routes/leagueRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', userRouter);
app.use('/api', matchRouter);
app.use('/api', playerRouter);
app.use('/api', fantasyTeamRouter);
app.use('/api', leagueRouter);



const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
