import { Wallet, Contract, BigNumberish, parseUnits, formatUnits } from "ethers";
import WalletModel from "../../models/wallet-model";
import UserModel from "../../models/user-model";
import { provider } from "../../utils/constants";
import secret from "../../config/secret-config";
import WalletService from "../../services/wallet-service";
import { TransactionService } from "../../modules/transaction/transaction-service";

const USDT_ADDRESS = "0x55d398326f99059ff775485246999027b3197955";
const USDT_DECIMALS = 6;
const USDT_THRESHOLD = parseUnits("20", USDT_DECIMALS);
const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
] as const;

export const walletChecker = async () => {
  try {
    const wallets = await WalletModel.find();
    for (const wallet of wallets) {
      const walletId = wallet._id as any;
      sweepUsdtBalance(walletId, secret.ADMIN_WALLET_ADDRESS).catch((err) => console.log(err));
    }
  } catch (error) {
    console.error("Error in walletChecker:", error);
  }
};

async function sweepUsdtBalance(walletId: string, adminAddress: string): Promise<void> {
  const walletDoc = await WalletModel.findById(walletId);
  if (!walletDoc) throw new Error("Wallet not found");

  const walletService = new WalletService();
  const userPrivKey = walletService.decryptPrivatekey(walletDoc.privateKey, secret.ENCRYPTION_PASSWORD);
  const signer = new Wallet(userPrivKey, provider);
  const usdt = new Contract(USDT_ADDRESS, USDT_ABI, signer) as any;

  const balance = await usdt.balanceOf(walletDoc.address);
  if (!balance || balance <= BigInt(0)) return;

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice!;
  //   const gasLimit = await usdt.transfer(adminAddress, balance).estimateGas;

  let gasLimit = 34515;

  console.log("Gas Price", gasPrice, "\nGas Limit", gasLimit);
  const feeAmount = Number(formatUnits(gasPrice)) * gasLimit;
  const feeStr = feeAmount.toFixed(18);
  const feeWei = parseUnits(feeStr, 18);

  console.log("Fee Amount", feeAmount);
  console.log("Balance", formatUnits(balance));

  const feeWalletPriv = secret.FEE_WALLET_PRIVATE_KEY;
  const feeSigner = new Wallet(feeWalletPriv, provider);
  await feeSigner.sendTransaction({ to: walletDoc.address, value: feeWei });

  const tx = await usdt.transfer(adminAddress, balance);
  await tx.wait();

  await UserModel.findByIdAndUpdate(walletDoc.userId, {
    $inc: { fundingBalance: Number(formatUnits(balance)) },
  });
  await TransactionService.createDeposit({
    userId: String(walletDoc.userId),
    hash: tx.hash,
    chain: "BSC",
    amount: Number(formatUnits(balance)),
  });
}
