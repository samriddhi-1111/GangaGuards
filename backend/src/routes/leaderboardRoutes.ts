import { Router } from "express";
import {
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getAllTimeLeaderboard
} from "../controllers/leaderboardController";

const router = Router();

router.get("/weekly", getWeeklyLeaderboard);
router.get("/monthly", getMonthlyLeaderboard);
router.get("/all-time", getAllTimeLeaderboard);

export default router;


