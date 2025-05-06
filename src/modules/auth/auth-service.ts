import UserModel, { IUser } from "../../models/user-model";
import crypto from "crypto";
import { notFoundResponse } from "../../utils/response-util";
import mongoose from "mongoose";
import TaskModel from "../../models/task-model";
import WalletService from "../../services/wallet-service";
import secret from "../../config/secret-config";
import WalletModel from "../../models/wallet-model";

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
        firstTime: true,
      });

      await user.save();

      const walletService = new WalletService();
      const { address, privateKey } = walletService.createWallet();

      const encryptedPk = walletService.encryptPrivatekey(privateKey, secret.ENCRYPTION_PASSWORD);
      const newWallet = new WalletModel({
        address,
        privateKey: encryptedPk,
        userId: user._id,
      });
      await newWallet.save();
    }

    if (user && user.firstTime === false) {
      user.firstTime = true;
      await user.save();
    }
    return user;
  }

  static async checkUserExistsByTelegramId(telegramId: number): Promise<boolean> {
    const user = await UserModel.findOne({ telegramId });
    return !!user?.firstTime;
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

    user.coinBalance += points;
    user.lastMiningClaim = now;

    await user.save();

    const upline = await UserModel.findById(user.upline);

    if (upline) {
      upline.coinBalance += points * 0.1;
      await upline.save();
    }

    return {
      message: "Mining points claimed successfully",
      updatedBalance: user.coinBalance,
    };
  }
}
