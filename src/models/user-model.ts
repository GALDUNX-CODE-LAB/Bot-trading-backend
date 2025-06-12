import mongoose, { Document, Schema, model, Types } from "mongoose";
import { IDeposit } from "./deposit-model";
import { IWithdrawal } from "./withdrawal-model";

export interface IUser extends Document {
  userName: string;
  telegramId: number;
  coinBalance: number;
  availableBalance: number;
  operatingBalance: number;
  fundingBalance: number;
  evhRewardBalance: number;
  deposits: Types.ObjectId[];
  withdrawals: Types.ObjectId[];
  completedTask: Types.ObjectId[];
  invites: Types.ObjectId[];
  upline: Types.ObjectId;
  firstTime: boolean;
  botActive: boolean;
  lastMiningClaim?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    telegramId: {
      type: Number,
      required: true,
      unique: true,
    },
    coinBalance: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },

    firstTime: {
      type: Boolean,
      required: true,
      default: false,
    },
    botActive: {
      type: Boolean,
      required: true,
      default: false,
    },
    operatingBalance: {
      type: Number,
      default: 0,
    },
    fundingBalance: {
      type: Number,
      default: 0,
    },
    evhRewardBalance: {
      type: Number,
      default: 0,
    },
    completedTask: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    invites: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    upline: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deposits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deposit" }],
    withdrawals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Withdrawal" }],
    lastMiningClaim: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
