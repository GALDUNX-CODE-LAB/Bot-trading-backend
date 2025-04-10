import UserModel, { IUser } from "../../models/user-model";
import crypto from "crypto";
import { notFoundResponse } from "../../utils/response-util";
import mongoose, { Types } from "mongoose";
import TaskModel from "../../models/task-model";

interface TelegramUserData {
  id: number;
  username?: string;
  auth_date: number;
  hash: string;
}

export class TelegramAuthService {
  private static BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

  static async verifyTelegramLogin(data: TelegramUserData): Promise<boolean> {
    // Skip verification in development for easier testing
    if (process.env.NODE_ENV === "development") {
      return true;
    }

    const dataCheckString = Object.keys(data)
      .filter((key) => key !== "hash")
      .sort()
      .map((key) => `${key}=${data[key as keyof TelegramUserData]}`)
      .join("\n");

    const secretKey = crypto.createHash("sha256").update(this.BOT_TOKEN).digest();

    const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    return hmac === data.hash;
  }

  static async findOrCreateUser(telegramData: TelegramUserData): Promise<IUser> {
    // const isValid = await this.verifyTelegramLogin(telegramData);
    // if (!isValid) {
    //   throw new Error('Invalid Telegram login data');
    // }

    //  find existing user
    let user = await UserModel.findOne({ telegramId: telegramData.id });

    if (!user) {
      // Create new user with initial balances
      user = await UserModel.create({
        telegramId: telegramData.id,
        userName: telegramData.username || `user_${telegramData.id}`,
        coinBalance: 0,
        availableBalance: 0,
        operatingBalance: 0,
        completedTask: [],
        deposits: [],
        withdrawals: [],
      });

      await user.save();
    }

    return user;
  }

  static async checkUserExistsByTelegramId(telegramId: number): Promise<boolean> {
    const user = await UserModel.exists({ telegramId });
    return !!user;
  }

  static async getCompletedTasks(userId: string) {
    const user = await UserModel.findById(userId).lean();

    if (!user || !user.completedTask || user.completedTask.length === 0) {
      return [];
    }
    const completedTasks = await TaskModel.find({
      _id: { $in: user.completedTask.map((id) => new mongoose.Types.ObjectId(id)) },
    });
    return completedTasks;
  }

  static async claimMiningPoints(userId: string, points: number) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    const now = new Date();

    if (user.lastMiningClaim) {
      const diff = now.getTime() - user.lastMiningClaim.getTime();
      const hoursPassed = diff / (1000 * 60 * 60);

      if (hoursPassed < 24) {
        throw new Error("You can only claim mining points once every 24 hours.");
      }
    }

    user.coinBalance += points;
    user.lastMiningClaim = now;

    await user.save();

    return {
      message: "Mining points claimed successfully",
      updatedBalance: user.coinBalance,
    };
  }

    static async inviteUser(inviterId: string, telegramId: number, userName: string) {
    let user = await UserModel.findOne({ telegramId });

    if (user) {
      return { user, message: "User already exists, signed in" };
    }

    user = await UserModel.create({
      userName,
      telegramId,
    });

    // Add invited user to inviter's invites
    await UserModel.findByIdAndUpdate(inviterId, {
      $push: { invites: user._id }
    });

    return { user, message: "User invited " };
  }
}


