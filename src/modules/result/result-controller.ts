import { Request, Response } from "express";
import { devResponse, errorResponse } from "../../utils/response-util";
import { ResultService } from "./result-service";

export class ResultController {
  static async getUserTradeStats(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const { chain, fromDate, toDate, pnl } = req.query;

      const data = await ResultService.getUserTradeStats(userId, {
        chain: chain as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
        pnl: pnl as 'Profit' | 'Loss',
      });

      return devResponse(res, data);
    } catch (err) {
      console.error("Error getting user trade stats:", err);
      return errorResponse(res, "Failed to fetch trade statistics");
    }
  }
}

