import DepositModel from "../../models/deposit-model";
import WithdrawalModel from "../../models/withdrawal-model";
import UserModel from "../../models/user-model";
import { Types } from "mongoose";

export class TransactionService {
// static async createDeposit(data: {
//   userId: string;
//   hash: string;
//   chain: string;
//   amount: number;
// }) {
//   const { userId, hash, chain, amount } = data;

//   // 1. Validation - amount should be positive
//   if (amount <= 0) {
//     throw new Error("Amount must be greater than 0");
//   }

//   // 2. Check for duplicate hash
//   const existingDeposit = await DepositModel.findOne({ hash });
//   if (existingDeposit) {
//     throw new Error("Deposit hash already exists");
//   }

//   // 3. Create the deposit
//   const deposit = await DepositModel.create({
//     userId,
//     hash,
//     chain,
//     amount,
//     status: "Confirmed",
//   });

//   // 4. Update user’s deposit list and operating balance
//   const user = await UserModel.findById(userId);
//   if (!user) {
//     throw new Error("User not found");
//   }

  static async createDeposit(data: { userId: string; hash: string; chain: string; amount: number }) {
    const { userId, hash, chain, amount } = data;

    // 1. Validation - amount should be positive
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // 2. Check for duplicate hash
    const existingDeposit = await DepositModel.findOne({ hash });
    if (existingDeposit) {
      throw new Error("Deposit hash already exists");
    }

    // 3. Create the deposit
    const deposit = await DepositModel.create({
      userId,
      hash,
      chain,
      amount,
      status: "Pending",
    });

    // 4. Update user's deposit list & balances
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.deposits.push(deposit._id as Types.ObjectId); // push deposit ref
    user.fundingBalance += amount;
    // user.coinBalance += amount; // or adjust depending on your rules

    await user.save();

    // 5. Return result
    return {
      deposit,
      updatedBalance: user.availableBalance,
      coinBalance: user.coinBalance,
    };
  }
//   static async createWithdrawal(userId: Types.ObjectId, amount: number, chain: string, address: string) {
//     const user = await UserModel.findById(userId);
//     if (!user) throw new Error("User not found");
//     if (user.availableBalance < amount) throw new Error("Insufficient balance");

//     const withdrawal = await WithdrawalModel.create({ userId, amount, chain, address, status: "Pending" });

//   user.deposits.push(deposit._id as Types.ObjectId); // push deposit reference
//   user.operatingBalance += amount; // ✅ only update operating balance

//   await user.save();

//   // 5. Return result
//   return {
//     deposit,
//     operatingBalance: user.operatingBalance,
//   };
// }

static async createWithdrawal(userId: Types.ObjectId, amount: number, chain: string, address: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.availableBalance < amount) {
    throw new Error('Insufficient balance');
  }


  // Create the withdrawal record
  const withdrawal = await WithdrawalModel.create({
    userId,
    amount,
    chain,
    status: 'Confirmed', // You can change this if needed
  });

  // Update user's withdrawal list and deduct only from availableBalance
  await UserModel.findByIdAndUpdate(userId, {
    $push: { withdrawals: withdrawal._id },
    $inc: { availableBalance: -amount },
  });

  return withdrawal;
}

  //   static async getUserTransactions(userId: string,  type?: 'deposit' | 'withdrawal') {
  // let deposits: any[] = [];
  // let withdrawals: any[] = [];

  static async getUserTransactions(userId: string, type?: "deposit" | "withdrawal") {
    let deposits: any[] = [];
    let withdrawals: any[] = [];

    if (!type || type === "deposit") {
      deposits = await DepositModel.find({ userId }).lean();
    }

    if (!type || type === "withdrawal") {
      withdrawals = await WithdrawalModel.find({ userId }).lean();
    }
    // const deposits = await DepositModel.find({ userId }).lean();
    // const withdrawals = await WithdrawalModel.find({ userId }).lean();

    const formattedDeposits = deposits.map((deposit) => ({
      type: "received",
      amount: deposit.amount,
      chain: deposit.chain,
      date: deposit.createdAt,
      status: deposit.status,
      hash: deposit.hash,
      _id: deposit._id,
    }));

    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      type: "sent",
      amount: withdrawal.amount,
      chain: withdrawal.chain,
      date: withdrawal.createdAt,
      status: withdrawal.status,
      _id: withdrawal._id,
    }));

    // Merge and sort by date (newest first)
    const allTransactions = [...formattedDeposits, ...formattedWithdrawals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return allTransactions;
  }
}