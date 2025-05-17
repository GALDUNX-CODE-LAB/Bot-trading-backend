import { Request, Response } from "express";
import { TransactionService } from "./transaction-service";
import response, { badReqResponse, devResponse, errorResponse, notFoundResponse } from "../../utils/response-util";
import UserModel from "../../models/user-model";
import WalletModel from "../../models/wallet-model";

export class TransactionController {
  static async deposit(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const { hash, chain, amount } = req.body;
      const deposit = await TransactionService.createDeposit({ userId, hash, chain, amount });
      return response(res, 200, deposit);
    } catch (error) {
      console.error("Error fetching signals:", error);
      return errorResponse(res);
    }
  }

  static async withdraw(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const { amount, chain, address } = req.body;
      const withdrawal = await TransactionService.createWithdrawal(userId as any, amount, chain, address);
      return devResponse(res, withdrawal);
    } catch (error) {
      console.error("Error fetching signals:", error);
      return errorResponse(res);
    }
  }

  static async getUserTransactions(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const { type } = req.query;

      if (type && type !== "deposit" && type !== "withdrawal") {
        return errorResponse(res, "Invalid type");
      }
      const transactions = await TransactionService.getUserTransactions(userId, type as "deposit" | "withdrawal");

      return response(res, 200, transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return errorResponse(res, "Could not fetch transactions");
    }
  }

  static async transfer(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const { amount, from, to } = req.body;

      if (!amount || amount <= 0 || !from || !to || from === to) {
        return badReqResponse(res, "Invalid transfer request");
      }

      const user = await UserModel.findById(userId);
      if (!user) return notFoundResponse(res);

      const balanceTypes = ["availableBalance", "fundingBalance", "operatingBalance"];

      if (!balanceTypes.includes(from) || !balanceTypes.includes(to)) {
        return badReqResponse(res, "Invalid balance types");
      }

      // @ts-ignore - accessing dynamic property
      if (user[from] < amount) {
        return badReqResponse(res, "Insufficient balance");
      }

      // @ts-ignore - accessing dynamic properties
      user[from] -= amount;
      // @ts-ignore
      user[to] += amount;

      console.log({ from, to });

      if (from === "fundingBalance" && to === "operatingBalance") {
        user.botActive = true;
        await user.save(); // ← make sure you await this!
      }

      await user.save();

      return devResponse(res, {
        message: `Transferred ${amount} from ${from} to ${to}`,
        balances: {
          availableBalance: user.availableBalance,
          fundingBalance: user.fundingBalance,
          operatingBalance: user.operatingBalance,
        },
      });
    } catch (error) {
      console.error("Error processing transfer:", error);
      return errorResponse(res, "Failed to transfer balance");
    }
  }

  static async userWallet(req: Request, res: Response) {
    const userId = req.session.userId;
    const wallet = await WalletModel.findOne({ userId });
    return response(res, 200, wallet?.address);
  }
}
