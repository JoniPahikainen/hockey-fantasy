import { Router } from "express";
import { getPlayoffBracket } from "../controllers/nhlBracket.controller";

const router = Router();

router.get("/nhl/playoff-bracket", getPlayoffBracket);

export default router;
