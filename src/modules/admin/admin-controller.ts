import { Request, Response } from "express";
import DepositModel from "../../models/deposit-model";
import WithdrawalModel from "../../models/withdrawal-model";
import UserModel from "../../models/user-model";
import response, { badReqResponse, errorResponse, notFoundResponse } from "../../utils/response-util";
import RoiModel from "../../models/roi-model";
import AddressModel, { IAddress } from "../../models/address-model";

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

  static updateImageLink = async (req: Request, res: Response) => {
    try {
      const { imageLink } = req.body;
      const id = "67f578e18619babaf8a9ed34";
      if (!id || imageLink === undefined) return errorResponse(res, "Missing id or ImageLink");
      const roi = await RoiModel.findById(id);
      if (!roi) return notFoundResponse(res, "Roi record not found");
      roi.imageLink = imageLink;
      await roi.save();
      return response(res, 200, roi);
    } catch (error) {
      return errorResponse(res, "Failed to update Image Link");
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
      const { telegramId, amount, balanceType } = req.body;
      if (!telegramId || amount === undefined) return badReqResponse(res, "Missing telegramId or amount");
      if (typeof amount !== "number" || amount <= 0) return badReqResponse(res, "Invalid amount");
      const user = await UserModel.findOne({ telegramId });
      if (!user) return notFoundResponse(res, "User not found");
      if (balanceType === "availableBalance") {
        await UserModel.findOneAndUpdate({ telegramId }, { availableBalance: user.availableBalance + Number(amount) });
      } else {
        await UserModel.findOneAndUpdate({ telegramId }, { operatingBalance: user.operatingBalance + Number(amount) });
      }
      await user.save();
      return response(res, 200, user);
    } catch (error) {
      return errorResponse(res, "Failed to fund user balance");
    }
  };

  static getAllAddresses = async (req: Request, res: Response) => {
    try {
      const addressData: IAddress | null = await AddressModel.findOne();
      if (!addressData) {
        return res.status(404).json({ message: "No network addresses found" });
      }
      response(res, 200, { addressConfig: addressData.addressConfig });
    } catch (err: any) {
      return errorResponse(res, "Failed to fetch addresses");
    }
  };
  static updateAddress = async (req: Request, res: Response) => {
    try {
      const { chain, address } = req.body;
      const addressId = "67fcce44cbdcd3c4403349ff";

      if (!chain || !address) {
        return badReqResponse(res, "Chain and address are required");
      }
      const addressDoc = await AddressModel.findById(addressId);
      if (!addressDoc) {
        return notFoundResponse(res, "Address configuration not found");
      }
      const existingIndex = addressDoc.addressConfig.findIndex((item) => item.chain === chain);

      if (existingIndex !== -1) {
        addressDoc.addressConfig[existingIndex].address = address;
      } else {
        addressDoc.addressConfig.push({ chain, address });
      }

      await addressDoc.save();
      return response(res, 200, "Updated successfully");
    } catch (error) {
      console.log(error);
      return errorResponse(res, "Failed to update address");
    }
  };
}
