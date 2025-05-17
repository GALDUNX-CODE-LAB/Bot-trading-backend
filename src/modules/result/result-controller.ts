import { Request, Response } from "express";
import response, { badReqResponse, devResponse, errorResponse, notFoundResponse } from "../../utils/response-util";
import { ResultService } from "./result-service";
import UserModel from "../../models/user-model";

export class ResultController {
  static async getUserTradeStats(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const { chain, fromDate, toDate } = req.query;

      const data = await ResultService.getUserTradeStats(userId, {
        fromDate: fromDate as string,
        toDate: toDate as string,
      });

      console.log("sssss", data);

      return response(res, 200, data);
    } catch (err) {
      console.error("Error getting user trade stats:", err);
      return errorResponse(res, "Failed to fetch trade statistics");
    }
  }

  static async getAllResults(req: Request, res: Response) {
    try {
      const results = await ResultService.getAllResults();
      return devResponse(res, results);
    } catch (err) {
      console.error("Error fetching all results:", err);
      return errorResponse(res, "Failed to fetch results");
    }
  }

  static async getUserResults(req: Request, res: Response) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return badReqResponse(res, "User ID not provided");
      }

      const results = await ResultService.getResultsByUser(userId);
      return response(res, 200, results);
    } catch (err) {
      console.error("Error fetching user results:", err);
      return errorResponse(res, "Failed to fetch user results");
    }
  }

  static async toggleBot(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const user = await UserModel.findById(userId);
      if (!user) {
        return notFoundResponse(res, "User not found");
      }
      const { toggle } = req.params;
      if (toggle === "on") {
        const operatingBalance = user.operatingBalance;
        if (operatingBalance <= 20) return badReqResponse(res, "Trading balance is less than 20$");
        user.botActive = true;
        await user.save();
      }

      if (toggle === "off") {
        const operatingBalance = user.operatingBalance;
        user.fundingBalance += operatingBalance;
        user.operatingBalance = 0;
        user.botActive = false;
        await user.save();
      }
      return devResponse(res, "Success");
    } catch (error) {
      console.error("Error on/offing bot:", error);
      return errorResponse(res, "Failed to toggle bot");
    }
  }
}
