import { Request, Response } from "express";
import { TelegramAuthService } from "./auth-service";
import JWTService from "../../services/jwt-service";
import response, { badReqResponse, devResponse, errorResponse, notFoundResponse } from "../../utils/response-util";
import UserModel from "../../models/user-model";
import DepositModel from "../../models/deposit-model";
import WithdrawalModel from "../../models/withdrawal-model";
import TaskModel from "../../models/task-model";
import bot from "../../bot/config/bot";
import secret from "../../config/secret-config";
import WalletModel from "../../models/wallet-model";

void DepositModel;
void WithdrawalModel;
void TaskModel;

const roiCache = new Map<string, { data: any; expiresAt: number }>();
const lastPingMap = new Map<number, Date>();

export class AuthController {
  static async telegramLogin(req: Request, res: Response) {
    try {
      const telegramData = req.body;

      if (!telegramData.id) {
        return res.status(400).json({ success: false, error: "Invalid Telegram data" });
      }

      const user = await TelegramAuthService.findOrCreateUser(telegramData);
      const jwtService = new JWTService();
      const accessToken = jwtService.createAccessToken({ telegramId: user.telegramId, userId: user._id });
      const refreshToken = jwtService.createRefreshToken({ telegramId: user.telegramId, userId: user._id });

      // Return user data (excluding sensitive fields)
      const userData = {
        id: user._id,
        telegramId: user.telegramId,
        userName: user.userName,
        coinBalance: user.coinBalance,
        availableBalance: user.availableBalance,
        fundingBalance: user.fundingBalance,
        operatingBalance: user.operatingBalance,
      };
      return devResponse(res, { accessToken, refreshToken, userData });
    } catch (error) {
      console.log("Error in authencate controller ", error);
      return errorResponse(res);
    }
  }

  static async adminLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (password !== secret.ADMIN_PASSWORD || email !== secret.ADMIN_EMAIL)
        return badReqResponse(res, "Invalid credential");

      const jwtService = new JWTService();
      const accessToken = jwtService.createAccessToken({ isAdmin: true });
      const refreshToken = jwtService.createRefreshToken({ isAdmin: true });

      return devResponse(res, { accessToken, refreshToken });
    } catch (error) {
      console.log(error);
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const userId = req.session.userId;

      const user = await UserModel.findById(userId)
        .select(
          "userName fundingBalance botActive  invites telegramId coinBalance availableBalance operatingBalance evhRewardBalance deposits withdrawal createdAt updatedAt"
        )
        .populate("invites")
        .lean();
      if (!user) {
        return notFoundResponse(res, "User not found");
      }
      const wallet = await WalletModel.findOne({ userId: user._id }).select("address").lean();

      return response(res, 200, { ...user, ...wallet });
    } catch (error) {
      console.error("Error fetching user:", error);
      return errorResponse(res, "Failed to fetch user");
    }
  }

  static async getUserStats(req: Request, res: Response) {
    try {
      // const { userId } = req.params;
      const userId = req.session.userId;

      const user = await UserModel.findById(userId)
        .populate("deposits withdrawals completedTask")
        .select("coinBalance availableBalance operatingBalance completedTask deposits withdrawals");

      if (!user) {
        return notFoundResponse(res, "User not found");
      }

      const stats = {
        totalCompletedTasks: user.completedTask.length,
        totalDeposits: user.deposits.length,
        totalWithdrawals: user.withdrawals.length,
        coinBalance: user.coinBalance,
        availableBalance: user.availableBalance,
        operatingBalance: user.operatingBalance,
      };

      return devResponse(res, stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return errorResponse(res);
    }
  }

  static async checkUserExists(req: Request, res: Response) {
    try {
      const { telegramId } = req.params;

      const exists = await TelegramAuthService.checkUserExistsByTelegramId(Number(telegramId));

      return response(res, 200, exists);
    } catch (error) {
      console.error("Error checking user existence:", error);
      return errorResponse(res, "Failed to check user");
    }
  }

  static async getCompletedTasks(req: Request, res: Response) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return errorResponse(res, "User not authenticated");
      }

      const tasks = await TelegramAuthService.getCompletedTasks(userId);
      return devResponse(res, tasks);
    } catch (error: any) {
      return errorResponse(res, error.message || "Could not fetch completed tasks");
    }
  }

  static async claimMiningPoints(req: Request, res: Response) {
    try {
      const userId = req.session?.userId; // or however you're storing session info
      const { points } = req.body;

      if (!userId || !points) {
        return errorResponse(res, "Missing user ID or points");
      }

      const result = await TelegramAuthService.claimMiningPoints(userId, points);
      return devResponse(res, result);
    } catch (error: any) {
      console.log(error);
      return errorResponse(res, error.message);
    }
  }

  static async roiInvest(req: Request, res: Response) {
    try {
      const key = "roi-stats";
      const now = Date.now();
      const cached = roiCache.get(key);

      if (cached && cached.expiresAt > now) {
        return response(res, 200, cached.data);
      }

      const MIN_RATE = 90;
      const MAX_RATE = 280;

      const ROIpercent = randomInRange(MIN_RATE, MAX_RATE);
      const winRate = randomInRange(MIN_RATE, MAX_RATE);
      const Totalpnl = randomInRange(MIN_RATE, MAX_RATE);

      const result = { ROIpercent, winRate, Totalpnl };
      const expiresAt = now + 86400000; // 24 hrs

      roiCache.set(key, { data: result, expiresAt });

      return response(res, 200, result);
    } catch (error: any) {
      return errorResponse(res, error.message || "Could not fetch ROI stats");
    }
  }

  static async getInvites(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  }

  static ping = async (req: Request, res: Response) => {
    try {
      let { telegramIds } = req.body;
      if (!telegramIds) return res.status(400).json({ message: "telegramIds is required" });
      if (!Array.isArray(telegramIds)) telegramIds = [telegramIds];

      const now = new Date();
      const twelveHours = 12 * 60 * 60 * 1000;
      const message = "Your upline reminds you to mine! Buzz up ⛏️🚀";

      const results = await Promise.all(
        telegramIds.map(async (id: number) => {
          if (lastPingMap.has(id)) {
            const lastPing = lastPingMap.get(id)!;
            if (now.getTime() - lastPing.getTime() < twelveHours) {
              return { telegramId: id, status: "skipped", message: "Ping was sent within the last 12 hours" };
            }
          }
          try {
            await bot.sendMessage(id, message);
            lastPingMap.set(id, now);
            return { telegramId: id, status: "sent" };
          } catch (error: any) {
            return { telegramId: id, status: "failed", error: error.message };
          }
        })
      );
      return res.status(200).json({ results });
    } catch (error: any) {
      return response(res, 500, error.message);
    }
  };
}

function randomInRange(min: number, max: number): number {
  return parseFloat((min + Math.random() * (max - min)).toFixed(2));
}
