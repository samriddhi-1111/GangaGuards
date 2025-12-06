import { Request, Response } from "express";
import { RewardTransaction } from "../models/RewardTransaction";
import { User } from "../models/User";

const getSinceDate = (period: "weekly" | "monthly") => {
  const now = new Date();
  if (period === "weekly") {
    now.setDate(now.getDate() - 7);
  } else {
    now.setDate(now.getDate() - 30);
  }
  return now;
};

const buildLeaderboard = async (period: "weekly" | "monthly") => {
  const since = getSinceDate(period);

  const agg = await RewardTransaction.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$pointsEarned" }
      }
    },
    { $sort: { totalPoints: -1 } },
    { $limit: 10 }
  ]);

  const userIds = agg.map((a) => a._id);
  const users = await User.find({ _id: { $in: userIds } })
    .select("name role points totalCleaned profileImageUrl")
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return agg.map((entry, index) => {
    const u = userMap.get(entry._id.toString());
    return {
      rank: index + 1,
      userId: entry._id,
      name: u?.name || "Unknown",
      role: u?.role || "NORMAL_USER",
      periodPoints: entry.totalPoints,
      totalPoints: u?.points ?? 0,
      totalCleaned: u?.totalCleaned ?? 0,
      profileImage: u?.profileImageUrl
    };
  });
};

export const getWeeklyLeaderboard = async (_req: Request, res: Response) => {
  try {
    const data = await buildLeaderboard("weekly");
    return res.json(data);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch weekly leaderboard" });
  }
};

export const getMonthlyLeaderboard = async (_req: Request, res: Response) => {
  try {
    const data = await buildLeaderboard("monthly");
    return res.json(data);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch monthly leaderboard" });
  }
};

export const getAllTimeLeaderboard = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({})
      .sort({ points: -1 })
      .limit(50)
      .lean();

    const data = users.map((u, index) => ({
      rank: index + 1,
      userId: u._id,
      name: u.name,
      role: u.role,
      periodPoints: u.points,
      totalPoints: u.points,
      totalCleaned: u.totalCleaned,
      profileImage: u.profileImageUrl
    }));

    return res.json(data);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to fetch all-time leaderboard" });
  }
};


