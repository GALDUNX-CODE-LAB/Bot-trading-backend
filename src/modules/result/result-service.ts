import ResultModel from "../../models/result-model";
import SignalModel from "../../models/signal-model";
import mongoose from "mongoose";

export class ResultService {
  static async getUserTradeStats(
    userId: string,
    filters: { chain?: string; fromDate?: string; toDate?: string; pnl?: 'Profit' | 'Loss' }
  ) {
    const { chain, fromDate, toDate, pnl } = filters;

    const dateFilter: any = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);

    // Construct query
    const query: any = {};
    if (Object.keys(dateFilter).length) query.createdAt = dateFilter;
    if (chain) query.pair = { $regex: new RegExp(chain, 'i') }; // case-insensitive chain match
    if (pnl) query.pnl = pnl;

    // Find all signals entered by this user (you may need to store a user reference on signals if not already)
    const signals = await SignalModel.find(query).lean();

    const totalTrades = signals.length;

    // 24h stats
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const trades24h = signals.filter((s) => new Date(s.createdAt) >= last24Hours);
    const volume24h = trades24h.reduce((sum, s) => sum + (s.amount || 0), 0);

    const openInterest = signals.filter((s) => s.percentage === 0).length;

    return {
      totalTrades,
      volume24h,
      openInterest,
      signals,
    };
  }
}


