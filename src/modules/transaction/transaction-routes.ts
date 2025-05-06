import { Router } from "express";
import { TransactionController } from "./transaction-controller";
import authHandler from "../../middleware/auth-handler";

const transactionRoute = Router();

transactionRoute.use(authHandler);
transactionRoute.post("/transactions/deposit", TransactionController.deposit);
transactionRoute.post("/transactions/withdraw", TransactionController.withdraw);
transactionRoute.get("/transactions", TransactionController.getUserTransactions);
transactionRoute.post("/transactions/transfer", TransactionController.transfer);
transactionRoute.post("/transactions/transfer", TransactionController.transfer);
transactionRoute.get("/transactions/wallets", TransactionController.userWallet);

export default transactionRoute;
