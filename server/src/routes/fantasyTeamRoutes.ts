import { Router } from 'express';
import { createTeam } from '../controllers/fantasyTeamController';
const router = Router();


router.post('/fantasy-teams', createTeam);
// TODO: Make adding/removing players


export default router;