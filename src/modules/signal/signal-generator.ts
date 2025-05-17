import SignalModel from "../../models/signal-model";

const pairs = [
  "BTC/ETH",
  "BTC/USDT",
  "ETH/USDT",
  "ADA/ETH",
  "SOL/ETH",
  "LINK/ETH",
  "DOT/ETH",
  "UNI/ETH",
  "MATIC/ETH",
  "LTC/BTC",
  "XRP/ETH",
  "DOGE/SHIB",
  "ATOM/USDT",
  "AVAX/USDT",
  "SOL/USDT",
  "DOT/USDT",
  "ADA/USDT",
  "LINK/USDT",
  "UNI/USDT",
  "MATIC/USDT",
] as const;

const pnls = ["Profit", "Loss"] as const;
const targets = ["1", "2"] as const;
const positions = ["Long", "Short"] as const;

export const generateRandomSignal = async () => {
  const signal = new SignalModel({
    pair: pairs[Math.floor(Math.random() * pairs.length)],
    pnl: pnls[Math.floor(Math.random() * pnls.length)].toLowerCase(), // lowercase because your schema expects lowercase
    amount: Number((Math.random() * 1000 + 100).toFixed(2)), // 100 - 1100
    percentage: Number((Math.random() * 15 + 1).toFixed(2)), // 1% - 16%
    target: targets[Math.floor(Math.random() * targets.length)],
    stopLoss: Number((Math.random() * 50 + 50).toFixed(2)), // 50 - 100
    entry: Number((Math.random() * 50000 + 10000).toFixed(2)), // e.g. 10k - 60k
    position: positions[Math.floor(Math.random() * positions.length)],
  });

  await signal.save();
  console.log("✅ New signal created at:", new Date().toISOString());
};
