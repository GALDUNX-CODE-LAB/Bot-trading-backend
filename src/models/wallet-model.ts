import mongoose, { Document, Schema, model } from "mongoose";

interface IWallet extends Document {
  privateKey: string;
  address: string;
  userId: mongoose.Types.ObjectId;
}

const WalletSchema = new Schema<IWallet>(
  {
    privateKey: { type: String, required: true },
    address: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

const WalletModel = model<IWallet>("Wallet", WalletSchema);

export default WalletModel;
