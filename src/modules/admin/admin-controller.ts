import { Request, Response } from "express";
import DepositModel from "../../models/deposit-model";
import WithdrawalModel from "../../models/withdrawal-model";
import UserModel from "../../models/user-model";
import response, { badReqResponse, errorResponse, notFoundResponse } from "../../utils/response-util";
import RoiModel from "../../models/roi-model";

export class AdminTransactionController {
  static updateDepositStatus = async (req: Request, res: Response) => {
    try {
      const { depositId, status } = req.body;
      if (!depositId || !status) return errorResponse(res, "Missing depositId or status");
      const deposit = await DepositModel.findById(depositId);
      if (!deposit) return notFoundResponse(res, "Deposit not found");
      const oldStatus = deposit.status;
      deposit.status = status;
      await deposit.save();
      const user = await UserModel.findById(deposit.userId);
      if (!user) return notFoundResponse(res, "User not found");
      if (oldStatus === "Pending" && status === "Confirmed") {
        user.fundingBalance += deposit.amount;
      }
      if (oldStatus === "Confirmed" && status === "Declined") {
        user.fundingBalance -= deposit.amount;
      }
      await user.save();
      return response(res, 200, deposit);
    } catch (error) {
      console.log("Error in updating depsit", error);
      return errorResponse(res, "Failed to update deposit status");
    }
  };

  static updateWithdrawalStatus = async (req: Request, res: Response) => {
    try {
      const { withdrawalId, status } = req.body;
      if (!withdrawalId || !status) return badReqResponse(res, "Missing withdrawalId or status");
      const withdrawal = await WithdrawalModel.findById(withdrawalId);
      if (!withdrawal) return notFoundResponse(res, "Withdrawal not found");
      const oldStatus = withdrawal.status;
      withdrawal.status = status;
      await withdrawal.save();
      const user = await UserModel.findById(withdrawal.userId);
      if (!user) return notFoundResponse(res, "User not found");
      if (oldStatus === "Pending" && status === "Confirmed") {
        user.availableBalance -= withdrawal.amount;
      }
      if (oldStatus === "Confirmed" && status === "Declined") {
        user.availableBalance += withdrawal.amount;
      }
      await user.save();
      return response(res, 200, withdrawal);
    } catch (error) {
      console.log("Error in updating withdrawal", error);
      return errorResponse(res, "Failed to update withdrawal status");
    }
  };

  static getPendingDeposits = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string) || "Pending";
      const deposits = await DepositModel.find({ status }).populate("userId").lean();
      return response(res, 200, deposits);
    } catch (error) {
      return errorResponse(res, "Failed to fetch deposits");
    }
  };

  static getPendingWithdrawals = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string) || "Pending";
      const withdrawals = await WithdrawalModel.find({ status }).populate("userId").lean();
      return response(res, 200, withdrawals);
    } catch (error) {
      return errorResponse(res, "Failed to fetch withdrawals");
    }
  };

  static stats = async (req: Request, res: Response) => {
    try {
      const depositAgg = await DepositModel.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
      const withdrawalAgg = await WithdrawalModel.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
      const totalUser = await UserModel.countDocuments({});
      const totalDeposit = depositAgg[0] ? depositAgg[0].total : 0;
      const totalWithdrawal = withdrawalAgg[0] ? withdrawalAgg[0].total : 0;
      return response(res, 200, { totalDeposit, totalWithdrawal, totalUser });
    } catch (error) {
      return errorResponse(res, "Failed to get stats");
    }
  };

  static updatePercentageAmount = async (req: Request, res: Response) => {
    try {
      const { percentageAmount } = req.body;
      const id = "67f578e18619babaf8a9ed34";
      if (!id || percentageAmount === undefined) return errorResponse(res, "Missing id or percentageAmount");
      const roi = await RoiModel.findById(id);
      if (!roi) return notFoundResponse(res, "Roi record not found");
      roi.percentageAmount = percentageAmount;
      await roi.save();
      return response(res, 200, roi);
    } catch (error) {
      return errorResponse(res, "Failed to update percentageAmount");
    }
  };

  static getUserStats = async (req: Request, res: Response) => {
    try {
      const depositsAgg = await DepositModel.aggregate([
        { $group: { _id: "$userId", totalDeposited: { $sum: "$amount" } } },
      ]);
      const withdrawalsAgg = await WithdrawalModel.aggregate([
        { $group: { _id: "$userId", totalWithdraw: { $sum: "$amount" } } },
      ]);
      const users = await UserModel.find({}).lean();
      const depositMap = depositsAgg.reduce((acc, cur) => {
        acc[cur._id.toString()] = cur.totalDeposited;
        return acc;
      }, {});
      const withdrawalMap = withdrawalsAgg.reduce((acc, cur) => {
        acc[cur._id.toString()] = cur.totalWithdraw;
        return acc;
      }, {});
      const stats = users.map((user) => ({
        username: user.userName,
        telegramId: user.telegramId,
        totalDeposited: depositMap[user._id.toString()] || 0,
        totalWithdraw: withdrawalMap[user._id.toString()] || 0,
      }));
      return response(res, 200, stats);
    } catch (error) {
      return errorResponse(res, "Failed to fetch user stats");
    }
  };

  static fundUserBalance = async (req: Request, res: Response) => {
    try {
      const { telegramId, amount } = req.body;
      if (!telegramId || amount === undefined) return badReqResponse(res, "Missing telegramId or amount");
      if (typeof amount !== "number" || amount <= 0) return badReqResponse(res, "Invalid amount");
      const user = await UserModel.findOne({ telegramId });
      if (!user) return notFoundResponse(res, "User not found");
      //   user.availableBalance += amount;

      console.log({ telegramId, amount });
      await UserModel.findOneAndUpdate({ telegramId }, { availableBalance: user.availableBalance + Number(amount) });
      await user.save();
      return response(res, 200, user);
    } catch (error) {
      return errorResponse(res, "Failed to fund user balance");
    }
  };
}
